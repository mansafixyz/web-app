// Hand-written to match supabase/migrations/0001_init_schema.sql.
// If the schema changes, update this file (and ideally generate it for real
// with `supabase gen types typescript` once the project uses the CLI).
//
// IMPORTANT: every Row/Insert/Update/Args shape below must be declared with
// `type X = {...}`, never `interface X {...}`. Supabase's generic client
// constrains these against `Record<string, unknown>`, and TypeScript only
// treats plain object-literal `type` aliases as satisfying that, not
// `interface` declarations (interfaces don't get an implicit index
// signature for this kind of structural check). Using `interface` here
// silently makes every `.from(...)` call resolve to `never`.

export type AccountType = "human" | "agent";
export type PrivacyTier = "public" | "confidential" | "shielded";
export type AccountStatus = "active" | "paused" | "revoked";
export type CounterpartyType = "human" | "agent" | "x402" | "external";
export type PrivacyLayer = "Public" | "Confidential" | "Shielded";
export type TransactionStatus = "settled" | "pending" | "failed";
export type AlertType = "transfer" | "policy" | "security" | "system";
export type ApiKeyEnvironment = "live" | "test";
export type KycTier = "none" | "basic" | "verified";
export type ProfileRole = "human" | "agent" | "both";

export type ProfileSettings = {
  dailyLimit: number;
  monthlyLimit: number;
  requireConfirm: boolean;
  autoTopup: boolean;
  streamResults: boolean;
  saveHistory: boolean;
  dataSharing: boolean;
};

export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  wallet_address: string | null;
  kyc_tier: KycTier;
  role: ProfileRole;
  settings: ProfileSettings;
  deletion_requested_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Account = {
  id: string;
  owner_id: string;
  type: AccountType;
  name: string;
  handle: string;
  description: string | null;
  privacy_tier: PrivacyTier;
  balance: number;
  status: AccountStatus;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type AccountPublic = {
  id: string;
  owner_id: string;
  type: AccountType;
  name: string;
  handle: string;
  description: string | null;
  privacy_tier: PrivacyTier;
  status: AccountStatus;
  created_at: string;
};

export type SpendPolicy = {
  id: string;
  account_id: string;
  max_per_request: number;
  max_per_day: number;
  allowed_domains: string[];
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  from_account_id: string | null;
  to_account_id: string | null;
  from_display: string;
  to_display: string;
  counterparty_type: CounterpartyType;
  amount: number;
  memo: string | null;
  privacy_layer: PrivacyLayer;
  status: TransactionStatus;
  finality_ms: number | null;
  proof_hash: string | null;
  tx_sig: string | null;
  disclosed: boolean;
  disclosed_at: string | null;
  created_at: string;
};

export type Alert = {
  id: string;
  profile_id: string;
  type: AlertType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

export type AlertPreference = {
  id: string;
  profile_id: string;
  rule_key: string;
  label: string;
  enabled: boolean;
  created_at: string;
};

export type ApiKey = {
  id: string;
  profile_id: string;
  name: string;
  key_prefix: string;
  key_last4: string;
  key_hash: string;
  environment: ApiKeyEnvironment;
  active: boolean;
  last_used_at: string | null;
  created_at: string;
};

export type Webhook = {
  id: string;
  profile_id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
};

export type CardNetwork = "visa" | "mastercard";
export type VirtualCardStatus = "active" | "frozen";

export type VirtualCard = {
  id: string;
  profile_id: string;
  cardholder_name: string;
  network: CardNetwork;
  card_number: string;
  expiry_month: number;
  expiry_year: number;
  cvv: string;
  status: VirtualCardStatus;
  created_at: string;
};

type ProfileInsert = Partial<Profile> & Pick<Profile, "id" | "handle" | "display_name">;
type AccountInsert = Partial<Account> & Pick<Account, "owner_id" | "type" | "name" | "handle">;
type SpendPolicyInsert = Partial<SpendPolicy> & Pick<SpendPolicy, "account_id">;
type TransactionInsert = Partial<Transaction>;
type AlertInsert = Partial<Alert> & Pick<Alert, "profile_id" | "type" | "title" | "body">;
type AlertPreferenceInsert = Partial<AlertPreference> & Pick<AlertPreference, "profile_id" | "rule_key" | "label">;
type ApiKeyInsert = Partial<ApiKey> &
  Pick<ApiKey, "profile_id" | "name" | "key_prefix" | "key_last4" | "key_hash" | "environment">;
type WebhookInsert = Partial<Webhook> & Pick<Webhook, "profile_id" | "url">;
type VirtualCardInsert = Partial<VirtualCard> &
  Pick<VirtualCard, "profile_id" | "cardholder_name" | "network" | "card_number" | "expiry_month" | "expiry_year" | "cvv">;

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: ProfileInsert; Update: Partial<Profile>; Relationships: [] };
      accounts: { Row: Account; Insert: AccountInsert; Update: Partial<Account>; Relationships: [] };
      spend_policies: { Row: SpendPolicy; Insert: SpendPolicyInsert; Update: Partial<SpendPolicy>; Relationships: [] };
      transactions: { Row: Transaction; Insert: TransactionInsert; Update: Partial<Transaction>; Relationships: [] };
      alerts: { Row: Alert; Insert: AlertInsert; Update: Partial<Alert>; Relationships: [] };
      alert_preferences: {
        Row: AlertPreference;
        Insert: AlertPreferenceInsert;
        Update: Partial<AlertPreference>;
        Relationships: [];
      };
      api_keys: { Row: ApiKey; Insert: ApiKeyInsert; Update: Partial<ApiKey>; Relationships: [] };
      webhooks: { Row: Webhook; Insert: WebhookInsert; Update: Partial<Webhook>; Relationships: [] };
      virtual_cards: { Row: VirtualCard; Insert: VirtualCardInsert; Update: Partial<VirtualCard>; Relationships: [] };
    };
    Views: {
      accounts_public: { Row: AccountPublic; Relationships: [] };
    };
    Functions: {
      send_payment: {
        Args: {
          p_from_account_id: string;
          p_recipient: string;
          p_amount: number;
          p_memo?: string | null;
          p_privacy_layer?: PrivacyLayer;
        };
        Returns: Transaction;
      };
      create_agent_account: {
        Args: {
          p_name: string;
          p_description: string | null;
          p_privacy_tier: PrivacyTier;
          p_max_per_request: number;
          p_max_per_day: number;
          p_initial_funding?: number;
          p_allowed_domains?: string[];
          p_webhook_url?: string | null;
        };
        Returns: Account;
      };
      revoke_agent_account: { Args: { p_account_id: string }; Returns: Account };
      set_agent_status: { Args: { p_account_id: string; p_status: "active" | "paused" }; Returns: Account };
      simulate_topup: { Args: { p_account_id: string; p_amount: number }; Returns: Transaction };
      generate_disclosure: { Args: { p_transaction_id: string }; Returns: Transaction };
    };
  };
};
