# FSAOutlet — Database Schema Proposal

PostgreSQL 15+ (Supabase). Sketch DDL — indicative, not final migration source.
**Money is always integer cents (`bigint`).** All tables carry `created_at`/`updated_at`.
IDs are UUIDv7 (time-ordered, index-friendly) unless noted.

---

## Entity relationship overview

```
                              ┌──────────────┐
  ┌──────────┐   ┌────────────┤  categories  │ (self-referencing tree)
  │  brands  │   │            └──────────────┘
  └────┬─────┘   │
       │   ┌─────▼──────────────────────────────┐
       └──►│            products                │  ◄── the universal/master product
           │  (GTIN-14 identity, eligibility,   │
           │   SEO, content, is_demo)           │
           └───┬─────────────┬──────────┬───────┘
               │             │          │
     ┌─────────▼───┐  ┌──────▼──────┐  ┌▼────────────────┐
     │product_     │  │product_     │  │ product_prices  │ (current retail, computed)
     │images       │  │eligibility_ │  └─────────────────┘
     └─────────────┘  │history      │
                      └─────────────┘
               │
   ┌───────────▼────────────────────────────────┐      ┌──────────────┐
   │           supplier_products                │◄─────┤  suppliers   │
   │  (ONE PRODUCT ↔ MANY SUPPLIER OFFERS)      │      └──────────────┘
   └───┬──────────────────┬─────────────────────┘
       │                  │
 ┌─────▼───────────┐  ┌───▼──────────────┐
 │supplier_        │  │supplier_prices   │ (cost history, effective-dated)
 │inventory        │  └──────────────────┘
 └─────────────────┘

  CUSTOMER SIDE                          FULFILMENT SIDE
  ┌───────────┐                          ┌──────────────────┐
  │ customers │                          │ supplier_orders  │  PO 10034-MCK-1
  └─────┬─────┘                          └────────┬─────────┘
        │                                         │
  ┌─────▼────┐   ┌─────────────┐          ┌───────▼────────────────┐
  │  carts   │──►│ cart_items  │          │ supplier_order_items   │
  └──────────┘   └─────────────┘          └───────┬────────────────┘
        │                                         │
  ┌─────▼────┐   ┌─────────────┐   ONE     ┌──────▼──────┐   ┌───────────────┐
  │  orders  │──►│ order_items │◄──────────┤  shipments  │──►│ shipment_items│
  └─┬──────┬─┘   └──────┬──────┘  ORDER    └─────────────┘   └───────────────┘
    │      │            │         MANY POs
    │  ┌───▼──────┐  ┌──▼──────────────────┐
    │  │ payments │─►│ payment_allocations │ ◄── enables future FSA split tender
    │  └───┬──────┘  └─────────────────────┘
    │      │
    │  ┌───▼─────┐   ┌──────────┐   ┌──────────────┐
    └─►│ refunds │   │ returns  │──►│ return_items │
       └─────────┘   └──────────┘   └──────────────┘
```

---

## 1. Catalog

```sql
CREATE TABLE brands (
  id uuid PRIMARY KEY, name text NOT NULL, slug citext UNIQUE NOT NULL,
  logo_url text, description text, active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false
);

CREATE TABLE manufacturers (                      -- distinct from brand
  id uuid PRIMARY KEY, name text NOT NULL, slug citext UNIQUE NOT NULL
);

CREATE TABLE categories (
  id uuid PRIMARY KEY,
  parent_id uuid REFERENCES categories(id),
  name text NOT NULL,
  slug citext NOT NULL,
  path ltree NOT NULL,                            -- fast subtree queries
  description text, seo_title text, seo_description text, hero_copy text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (parent_id, slug)
);
CREATE INDEX ON categories USING gist (path);

CREATE TABLE products (
  id uuid PRIMARY KEY,                            -- internal_product_id
  sku text UNIQUE NOT NULL,                       -- OUR sku, never a supplier's
  gtin14 char(14) UNIQUE,                         -- normalised identity key
  upc text, mpn text,
  manufacturer_id uuid REFERENCES manufacturers(id),
  brand_id uuid REFERENCES brands(id),
  title text NOT NULL,
  short_description text, long_description text,
  ingredients text, warnings text, directions text, features jsonb,
  length_mm int, width_mm int, height_mm int, weight_g int,
  primary_category_id uuid REFERENCES categories(id),

  -- ELIGIBILITY: defaults are deliberately the "claim nothing" state
  fsa_status eligibility_status NOT NULL DEFAULT 'unverified',
  hsa_status eligibility_status NOT NULL DEFAULT 'unverified',
  eligibility_reason text,
  eligibility_source eligibility_source NOT NULL DEFAULT 'unknown',
  eligibility_last_verified timestamptz,
  prescription_required boolean NOT NULL DEFAULT false,
  lmn_required boolean NOT NULL DEFAULT false,

  map_cents bigint, msrp_cents bigint,
  tax_code text,                                  -- required by the tax provider
  age_restricted boolean NOT NULL DEFAULT false,
  restricted_states text[],                       -- state-level sale restrictions

  active boolean NOT NULL DEFAULT false,          -- nothing is live until published
  slug citext UNIQUE NOT NULL,
  seo_title text, seo_description text,
  is_demo boolean NOT NULL DEFAULT false,
  search_keywords text[],                         -- symptom/use terms
  published_at timestamptz
);

CREATE TYPE eligibility_status AS ENUM
  ('eligible','eligible_with_lmn','rx_required','not_eligible','unverified');
CREATE TYPE eligibility_source AS ENUM
  ('sigis_epl','distributor_feed','manual_review','unknown');

-- The ONLY definition of a displayable eligibility claim. Used everywhere.
CREATE VIEW v_product_eligibility_display AS
SELECT id,
  (fsa_status = 'eligible' AND eligibility_source <> 'unknown'
     AND eligibility_last_verified > now() - interval '365 days') AS show_fsa_badge,
  (hsa_status = 'eligible' AND eligibility_source <> 'unknown'
     AND eligibility_last_verified > now() - interval '365 days') AS show_hsa_badge
FROM products;

CREATE TABLE product_images (
  id uuid PRIMARY KEY, product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL, alt_text text NOT NULL, sort_order int NOT NULL DEFAULT 0,
  source image_source NOT NULL,                   -- publish validator REJECTS 'unknown'
  license_note text
);
CREATE TYPE image_source AS ENUM
  ('own_photography','supplier_authorized','manufacturer_authorized',
   'generated_placeholder','unknown');

CREATE TABLE product_categories (
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE product_eligibility_history (        -- audit; never deleted
  id bigserial PRIMARY KEY, product_id uuid NOT NULL REFERENCES products(id),
  fsa_status eligibility_status, hsa_status eligibility_status,
  source eligibility_source, reason text,
  changed_by uuid, changed_at timestamptz NOT NULL DEFAULT now(),
  import_run_id uuid
);
```

---

## 2. Suppliers and offers

```sql
CREATE TABLE suppliers (
  id uuid PRIMARY KEY, code text UNIQUE NOT NULL,          -- 'MCK','CAR','MDL','MOCK'
  name text NOT NULL,
  integration_type supplier_integration_type NOT NULL DEFAULT 'none',
  capabilities jsonb NOT NULL DEFAULT '{}',                -- see SupplierCapabilities
  config jsonb NOT NULL DEFAULT '{}',                      -- endpoints, paths, IDs
  credentials_ref text,                     -- NAME of a secret. NEVER the secret.
  priority int NOT NULL DEFAULT 100,
  reliability_score numeric(4,3) NOT NULL DEFAULT 1.000,   -- computed from history
  default_lead_time_days int, order_cutoff_time time, cutoff_timezone text,
  active boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT false
);
CREATE TYPE supplier_integration_type AS ENUM
  ('none','mock','rest_api','edi','sftp','csv_feed','xml_feed','manual');

CREATE TABLE supplier_products (          -- supplier SKU ≠ product. Many offers per product.
  id uuid PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  supplier_sku text NOT NULL,
  product_id uuid REFERENCES products(id),         -- NULL until matched
  match_method text, match_confidence numeric(4,3),
  supplier_cost_cents bigint,
  supplier_map_cents bigint, supplier_msrp_cents bigint,
  uom text, case_pack int NOT NULL DEFAULT 1, minimum_order_quantity int NOT NULL DEFAULT 1,
  dropship_available boolean NOT NULL DEFAULT false,
  dropship_fee_cents bigint NOT NULL DEFAULT 0,
  estimated_shipping_cost_cents bigint,
  lead_time_days int,
  active boolean NOT NULL DEFAULT true,
  admin_blocked boolean NOT NULL DEFAULT false,
  raw jsonb,                                        -- verbatim feed record
  import_run_id uuid,
  last_price_update timestamptz,
  is_demo boolean NOT NULL DEFAULT false,
  UNIQUE (supplier_id, supplier_sku)
);
CREATE INDEX ON supplier_products (product_id) WHERE active AND NOT admin_blocked;

CREATE TABLE supplier_inventory (          -- separate: very high write churn
  supplier_product_id uuid PRIMARY KEY REFERENCES supplier_products(id) ON DELETE CASCADE,
  available_quantity int, availability_status availability_status NOT NULL,
  last_inventory_update timestamptz NOT NULL DEFAULT now()
);
CREATE TYPE availability_status AS ENUM
  ('in_stock','low_stock','out_of_stock','backordered','unavailable','unknown');

CREATE TABLE supplier_prices (             -- effective-dated cost history
  id bigserial PRIMARY KEY,
  supplier_product_id uuid NOT NULL REFERENCES supplier_products(id) ON DELETE CASCADE,
  cost_cents bigint NOT NULL, map_cents bigint, msrp_cents bigint,
  effective_from timestamptz NOT NULL DEFAULT now(), effective_to timestamptz,
  import_run_id uuid
);

CREATE TABLE product_supplier_preferences (        -- admin override of routing
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  reason text, set_by uuid NOT NULL, set_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE routing_policies (           -- DB-tunable weights; no deploy to retune
  id uuid PRIMARY KEY, name text UNIQUE NOT NULL, active boolean NOT NULL DEFAULT false,
  weight_landed_cost numeric NOT NULL, weight_lead_time numeric NOT NULL,
  weight_reliability numeric NOT NULL, weight_priority numeric NOT NULL,
  weight_margin numeric NOT NULL,
  consolidation_threshold_cents bigint NOT NULL DEFAULT 200,
  allow_backorder boolean NOT NULL DEFAULT false
);
```

---

## 3. Pricing

```sql
CREATE TABLE price_rules (
  id uuid PRIMARY KEY,
  scope price_rule_scope NOT NULL,                  -- global|category|brand|supplier|product
  scope_id uuid,
  rule_type price_rule_type NOT NULL,
  value numeric NOT NULL,
  priority int NOT NULL DEFAULT 100,
  starts_at timestamptz, ends_at timestamptz,
  active boolean NOT NULL DEFAULT true, note text
);
CREATE TYPE price_rule_type AS ENUM
  ('markup_pct','margin_floor_pct','margin_floor_abs','fixed_price',
   'promo_pct','promo_fixed','manual_override');

CREATE TABLE product_prices (                       -- denormalised current price
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  retail_price_cents bigint NOT NULL,
  compare_at_cents bigint,
  cost_basis_cents bigint, margin_pct numeric, margin_abs_cents bigint,
  applied_rules jsonb NOT NULL DEFAULT '[]',
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_price_history (
  id bigserial PRIMARY KEY, product_id uuid NOT NULL,
  retail_price_cents bigint NOT NULL, cost_basis_cents bigint,
  reason text, changed_by uuid, changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE margin_violations (                    -- surfaced on admin dashboard
  id uuid PRIMARY KEY, product_id uuid NOT NULL REFERENCES products(id),
  violation_type text NOT NULL,        -- below_map | below_margin_floor | above_msrp | cost_spike
  detail jsonb, detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz, resolved_by uuid
);
```

---

## 4. Customers, carts

```sql
CREATE TABLE customers (
  id uuid PRIMARY KEY, auth_user_id uuid UNIQUE,   -- Supabase auth.users
  email citext UNIQUE NOT NULL, first_name text, last_name text, phone text,
  marketing_consent boolean NOT NULL DEFAULT false,
  health_data_consent_at timestamptz,              -- see RISKS.md #11 (WA MHMD etc.)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE addresses (
  id uuid PRIMARY KEY, customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  label text, first_name text, last_name text, company text,
  line1 text NOT NULL, line2 text, city text NOT NULL, state char(2) NOT NULL,
  postal_code text NOT NULL, country char(2) NOT NULL DEFAULT 'US', phone text,
  is_default_shipping boolean NOT NULL DEFAULT false,
  is_default_billing boolean NOT NULL DEFAULT false,
  validated_at timestamptz
);

CREATE TABLE carts (
  id uuid PRIMARY KEY, customer_id uuid REFERENCES customers(id),
  session_token text UNIQUE,                       -- guest carts
  status text NOT NULL DEFAULT 'active',
  subtotal_cents bigint NOT NULL DEFAULT 0,
  eligible_subtotal_cents bigint NOT NULL DEFAULT 0,   -- ← future split tender
  expires_at timestamptz
);

CREATE TABLE cart_items (
  id uuid PRIMARY KEY, cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price_cents bigint NOT NULL,                -- snapshot
  fsa_eligible_snapshot boolean NOT NULL,          -- snapshot: eligibility must survive
  hsa_eligible_snapshot boolean NOT NULL,          --   a mid-session catalog change
  UNIQUE (cart_id, product_id)
);
```

---

## 5. Orders, fulfilment, money

```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY,
  order_number text UNIQUE NOT NULL,                -- '10034' — customer-facing
  customer_id uuid REFERENCES customers(id),        -- NULL for guest
  email citext NOT NULL,
  status order_status NOT NULL DEFAULT 'pending_payment',
  subtotal_cents bigint NOT NULL,
  eligible_subtotal_cents bigint NOT NULL,
  discount_cents bigint NOT NULL DEFAULT 0,
  shipping_cents bigint NOT NULL DEFAULT 0,
  tax_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL,
  shipping_address_id uuid REFERENCES addresses(id),
  billing_address_id uuid REFERENCES addresses(id),
  routing_trace jsonb,                              -- why each line went where
  placed_at timestamptz, cancelled_at timestamptz
);
CREATE TYPE order_status AS ENUM
  ('pending_payment','paid','routing','submitted','partially_shipped','shipped',
   'delivered','on_hold','cancelled','partially_refunded','refunded');

CREATE TABLE order_items (
  id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(id),
  product_id uuid NOT NULL REFERENCES products(id),
  sku_snapshot text NOT NULL, title_snapshot text NOT NULL,   -- immutable record
  quantity int NOT NULL, unit_price_cents bigint NOT NULL, line_total_cents bigint NOT NULL,
  fsa_eligible_snapshot boolean NOT NULL, hsa_eligible_snapshot boolean NOT NULL,
  tax_code text, tax_cents bigint NOT NULL DEFAULT 0,
  quantity_shipped int NOT NULL DEFAULT 0,
  quantity_cancelled int NOT NULL DEFAULT 0,
  quantity_returned int NOT NULL DEFAULT 0
);

CREATE TABLE supplier_orders (                      -- the internal PO
  id uuid PRIMARY KEY,
  po_number text UNIQUE NOT NULL,                   -- '10034-MCK-1'
  order_id uuid NOT NULL REFERENCES orders(id),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  status supplier_order_status NOT NULL DEFAULT 'draft',
  idempotency_key text UNIQUE NOT NULL,             -- retries never double-order
  supplier_reference text,                          -- their PO/order id
  subtotal_cost_cents bigint, freight_cost_cents bigint, dropship_fee_cents bigint,
  submitted_at timestamptz, acknowledged_at timestamptz,
  attempts int NOT NULL DEFAULT 0, last_error text, rejection_reason text
);
CREATE TYPE supplier_order_status AS ENUM
  ('draft','ready','submitted','acknowledged','partially_shipped','shipped',
   'invoiced','closed','rejected','cancelled','failed');

CREATE TABLE supplier_order_items (
  id uuid PRIMARY KEY,
  supplier_order_id uuid NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id),
  supplier_product_id uuid NOT NULL REFERENCES supplier_products(id),
  quantity_ordered int NOT NULL,
  quantity_acknowledged int, quantity_shipped int NOT NULL DEFAULT 0,
  quantity_cancelled int NOT NULL DEFAULT 0, quantity_backordered int NOT NULL DEFAULT 0,
  unit_cost_cents bigint NOT NULL
);

CREATE TABLE shipments (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id),
  supplier_order_id uuid NOT NULL REFERENCES supplier_orders(id),
  carrier text, tracking_number text, tracking_url text,
  status text NOT NULL DEFAULT 'pending',
  shipped_at timestamptz, estimated_delivery date, delivered_at timestamptz
);
CREATE TABLE shipment_items (
  shipment_id uuid REFERENCES shipments(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES order_items(id),
  quantity int NOT NULL, PRIMARY KEY (shipment_id, order_item_id)
);

CREATE TABLE payments (
  id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(id),
  provider text NOT NULL DEFAULT 'stripe',
  provider_ref text UNIQUE,                         -- pi_...
  tender_type tender_type NOT NULL DEFAULT 'card',  -- future: fsa_card | hsa_card
  authorized_amount_cents bigint NOT NULL,
  captured_amount_cents bigint NOT NULL DEFAULT 0,
  refunded_amount_cents bigint NOT NULL DEFAULT 0,
  eligible_amount_applied_cents bigint NOT NULL DEFAULT 0,
  status text NOT NULL, last4 text, brand text      -- NEVER a full PAN
);
CREATE TYPE tender_type AS ENUM ('card','fsa_card','hsa_card','gift_card','store_credit');

CREATE TABLE payment_allocations (   -- ← the table that makes split tender possible later
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES order_items(id),
  amount_cents bigint NOT NULL, PRIMARY KEY (payment_id, order_item_id)
);

CREATE TABLE refunds (
  id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(id),
  payment_id uuid NOT NULL REFERENCES payments(id),
  provider_ref text UNIQUE, amount_cents bigint NOT NULL,
  reason text NOT NULL, status text NOT NULL, created_by uuid
);

CREATE TABLE returns (
  id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(id),
  rma_number text UNIQUE NOT NULL,
  supplier_order_id uuid REFERENCES supplier_orders(id),
  supplier_rma text, status text NOT NULL DEFAULT 'requested',
  reason text, return_label_url text, received_at timestamptz
);
CREATE TABLE return_items (
  id uuid PRIMARY KEY, return_id uuid NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id),
  quantity int NOT NULL, disposition text, restocking_fee_cents bigint NOT NULL DEFAULT 0
);
```

---

## 6. Ingestion, jobs, operations

```sql
CREATE TABLE import_runs (
  id uuid PRIMARY KEY, supplier_id uuid NOT NULL REFERENCES suppliers(id),
  kind text NOT NULL,                       -- catalog | inventory | price
  source text, dry_run boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending',   -- pending|running|halted_for_approval|completed|failed|rolled_back
  counts jsonb NOT NULL DEFAULT '{}',       -- created/updated/skipped/errored/queued
  blast_radius jsonb,                       -- what the run WOULD change (dry-run diff)
  started_at timestamptz, finished_at timestamptz, triggered_by uuid
);

CREATE TABLE import_records (
  id bigserial PRIMARY KEY, import_run_id uuid NOT NULL REFERENCES import_runs(id),
  row_number int, raw jsonb NOT NULL, normalized jsonb,
  status text NOT NULL, errors jsonb,
  matched_product_id uuid, match_method text, match_confidence numeric(4,3)
);

CREATE TABLE product_match_queue (          -- low-confidence matches need a human
  id uuid PRIMARY KEY, supplier_product_id uuid NOT NULL REFERENCES supplier_products(id),
  candidates jsonb NOT NULL, status text NOT NULL DEFAULT 'pending',
  resolved_product_id uuid, resolved_by uuid, resolved_at timestamptz
);

CREATE TABLE jobs (                          -- durable queue; SKIP LOCKED workers
  id uuid PRIMARY KEY, type text NOT NULL, payload jsonb NOT NULL DEFAULT '{}',
  run_at timestamptz NOT NULL DEFAULT now(), attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'queued',     -- queued|running|succeeded|failed|dead
  locked_at timestamptz, locked_by text, last_error text,
  dedupe_key text UNIQUE
);
CREATE INDEX ON jobs (status, run_at) WHERE status = 'queued';

CREATE TABLE outbox_events (                 -- written in the order's own transaction
  id bigserial PRIMARY KEY, aggregate_type text NOT NULL, aggregate_id uuid NOT NULL,
  event_type text NOT NULL, payload jsonb NOT NULL,
  published_at timestamptz
);

CREATE TABLE webhook_events (                -- Stripe replay protection
  id uuid PRIMARY KEY, provider text NOT NULL, provider_event_id text NOT NULL,
  payload jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz, error text,
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY, actor_id uuid, actor_type text NOT NULL,
  action text NOT NULL, entity_type text NOT NULL, entity_id uuid,
  before jsonb, after jsonb, ip inet, at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_users (
  user_id uuid PRIMARY KEY,                  -- Supabase auth.users
  role admin_role NOT NULL, mfa_enrolled_at timestamptz, active boolean NOT NULL DEFAULT true
);
CREATE TYPE admin_role AS ENUM
  ('owner','admin','merchandiser','ops','support','readonly');

CREATE TABLE feature_flags (
  key text PRIMARY KEY, enabled boolean NOT NULL DEFAULT false,
  payload jsonb, updated_by uuid, updated_at timestamptz NOT NULL DEFAULT now()
);
-- seeded: FSA_CARD_ACCEPTANCE_ENABLED = false
```

---

## 7. Search, content, merchandising

```sql
CREATE TABLE product_search_index (
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  document tsvector NOT NULL,                       -- weighted A/B/C/D
  title text NOT NULL, brand_name text, category_path ltree,
  gtin14 char(14), upc text, mpn text,
  price_cents bigint, show_fsa_badge boolean, show_hsa_badge boolean,
  availability availability_status, popularity numeric NOT NULL DEFAULT 0
);
CREATE INDEX ON product_search_index USING gin (document);
CREATE INDEX ON product_search_index USING gin (title gin_trgm_ops);   -- autocomplete
CREATE INDEX ON product_search_index USING gin (brand_name gin_trgm_ops);
CREATE INDEX ON product_search_index (show_fsa_badge, availability, price_cents);

CREATE TABLE content_pages (                        -- /learn/*
  id uuid PRIMARY KEY, slug citext UNIQUE NOT NULL, title text NOT NULL,
  body_mdx text NOT NULL, seo_title text, seo_description text,
  status text NOT NULL DEFAULT 'draft',
  reviewed_by text, reviewed_at timestamptz,        -- editorial/medical sign-off gate
  published_at timestamptz
);

CREATE TABLE collections (                          -- Deals, Shop by Balance, merchandising
  id uuid PRIMARY KEY, slug citext UNIQUE NOT NULL, title text NOT NULL,
  kind text NOT NULL,                               -- manual | rule_based | balance
  rules jsonb,                                      -- e.g. {"max_price_cents": 2500}
  seo_title text, seo_description text, hero_copy text,
  active boolean NOT NULL DEFAULT true, sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE collection_products (
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0, PRIMARY KEY (collection_id, product_id)
);

CREATE TABLE basket_templates (                     -- Spend My FSA themes, admin-editable
  id uuid PRIMARY KEY, name text NOT NULL, description text,
  category_weights jsonb NOT NULL, persona_tags text[],
  min_items int NOT NULL DEFAULT 4, max_items int NOT NULL DEFAULT 12,
  max_qty_per_sku int NOT NULL DEFAULT 2, active boolean NOT NULL DEFAULT true
);

CREATE TABLE events (                               -- first-party funnel analytics
  id bigserial PRIMARY KEY, session_id text, customer_id uuid,
  name text NOT NULL, payload jsonb, occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE redirects (
  from_path citext PRIMARY KEY, to_path text NOT NULL, status_code int NOT NULL DEFAULT 301
);
```

---

## 8. Index plan (beyond those inline)

```sql
CREATE INDEX ON products (active, primary_category_id) WHERE active;
CREATE INDEX ON products (gtin14) WHERE gtin14 IS NOT NULL;
CREATE INDEX ON products (eligibility_last_verified) WHERE fsa_status = 'eligible';
CREATE INDEX ON orders (customer_id, placed_at DESC);
CREATE INDEX ON orders (status, placed_at DESC);
CREATE INDEX ON order_items (order_id);
CREATE INDEX ON supplier_orders (status, submitted_at)
  WHERE status IN ('ready','submitted','failed');           -- ops queue
CREATE INDEX ON shipments (order_id);
CREATE INDEX ON supplier_inventory (availability_status);
CREATE INDEX ON import_records (import_run_id, status);
CREATE INDEX ON audit_log (entity_type, entity_id, at DESC);
CREATE INDEX ON events (name, occurred_at DESC);
```

## 9. Row-level security

RLS is enabled on `customers`, `addresses`, `carts`, `cart_items`, `orders`,
`order_items`, `shipments`, `returns` as defence in depth (a customer may read only
their own rows). It is **not** the primary authorisation mechanism: the browser never
receives a Supabase client for commerce data, and all access is mediated server-side.
Supplier, cost, margin and routing tables are server-role only and have no client policy
at all — wholesale cost must never be reachable from a browser.
