export interface PacketMeta {
  name: string;
  version: string;
  generated: string;
  client_id: string;
}

export interface HouseholdPerson {
  id: string;
  role: 'taxpayer' | 'spouse' | 'dependent';
  name: string;
  ssn: string;
  dob: string;
  occupation?: string;
  relationship?: string;
  months_lived_with_you?: number;
  full_time_student?: boolean;
  ip_pin?: string | null;
  phone?: string;
  email?: string;
  note?: string;
  own_income?: string;
}

export interface HouseholdAddress {
  from: string;
  to: string | null;
  address: string;
  type: string;
}

export interface ResidencyPeriod {
  state: string;
  from: string;
  to: string;
  status: string;
}

export interface RelatedReturn {
  who: string;
  return: string;
  prepared_by: string;
  in_this_packet: boolean | string;
}

export interface HouseholdData {
  filing_status: string;
  tax_year: number;
  entered_by: string;
  people: HouseholdPerson[];
  addresses: HouseholdAddress[];
  residency: ResidencyPeriod[];
  bank_account_for_refund_or_payment: {
    routing: string;
    account: string;
    type: string;
    bank: string;
  };
  prior_year_agi_for_esignature: number;
  related_returns: RelatedReturn[];
}

export interface DocumentPage {
  page: number;
  printed_content: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  document_type: string;
  issuer: string;
  belongs_to: string;
  tax_year: number;
  received_at: string;
  uploaded_by: 'client' | 'firm';
  file_name: string;
  page_count: number;
  pages: DocumentPage[];
  marked_corrected?: boolean;
  extraction: {
    status: 'extracted' | 'partial' | 'not_extracted';
    values: number;
    reason: string | null;
  };
}

export interface ExtractedValue {
  id: string;
  document_id: string;
  page: number;
  field: string;
  label: string;
  value: string | number | boolean | null;
  value_type: string;
  text_as_read: string;
  position: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}

export interface QuestionnaireItem {
  id: string;
  question: string;
  answer: string;
  answered_by: string;
  answered_at: string;
}

export interface ClientMessage {
  id: string;
  sent_at: string;
  from: string;
  to: string;
  text: string;
}

export interface CallNote {
  id: string;
  date: string;
  participants: string[];
  notes: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'preparer' | 'reviewer' | 'partner' | 'firm_administrator' | 'quality_reviewer';
  credential: string | null;
  sensitive_data_clearance: boolean;
  active_from: string;
  note?: string;
}

export interface ClientUser {
  id: string;
  name: string;
  role: 'client';
}

export interface FirmData {
  name: string;
  firm_identity: {
    ein: string;
    address: string;
    efin: string;
    ero_pin: string;
    ptins: Record<string, string>;
    signing_preparer: string;
  };
  staff: StaffMember[];
  client_users: ClientUser[];
  assignment_at_start: Record<string, string>;
  deadlines: Array<{ what: string; date: string }>;
  budget_hours: Record<string, number>;
  starter_standards: {
    note: string;
    verification_types: string[];
    variance_review: { threshold_dollars: number; threshold_percent: number };
    review_levels: string[];
    rules: string[];
    required_steps: string[];
  };
}

export interface ReturnLine {
  key: string;
  jurisdiction: 'federal' | 'california';
  form: string;
  line: string;
  label: string;
  value: number | string;
  rule?: string;
  inputs?: string[];
  sources?: string[];
  note?: string | null;
}

export interface AssetRecord2025 {
  asset_id: string;
  description: string;
  activity: string;
  cost: number;
  land_value_not_depreciated?: number;
  placed_in_service: string;
  method: string;
  life_years: number;
  federal: {
    prior_accumulated: number;
    depreciation_2025: number;
    accumulated_end?: number;
    special_depreciation_2025?: number;
  };
  california: {
    prior_accumulated: number;
    depreciation_2025: number;
    accumulated_end?: number;
  };
  amt: {
    depreciation_2025: number;
    difference_from_regular: number;
  };
  disposed?: {
    date: string;
    sales_price_allocated?: number;
    selling_expenses_allocated?: number;
    depreciation_recapture_1250?: number;
    section_1231_gain?: number;
  } | null;
  sources: string[];
}

export interface DiagnosticItem {
  code: string;
  severity: 'info' | 'warning';
  message: string;
  refs: string[];
}

export interface TaxEffectRate {
  federal_per_dollar: number;
  california_per_dollar: number;
}

export interface ReturnVersion {
  version: 'v1' | 'v2' | 'v3';
  computed_at: string;
  trigger: string;
  documents_used: string[];
  documents_superseded: string[];
  summary: {
    federal: {
      agi: number;
      taxable_income: number;
      total_tax: number;
      payments: number;
      balance_due: number;
      penalty: number;
    };
    california: {
      total_agi: number;
      ca_agi: number;
      total_tax: number;
      payments: number;
      balance_due: number;
      penalty: number;
    };
  };
  tax_effect_rates: Record<string, TaxEffectRate>;
  carryovers_out: {
    federal: Record<string, number>;
    california: Record<string, any>;
  };
  assets: AssetRecord2025[];
  diagnostics: DiagnosticItem[];
  changes_from_previous: Array<{
    key: string;
    change: 'added' | 'changed' | 'removed';
    old: any;
    new: any;
  }>;
  lines: ReturnLine[];
}

export interface WhatIfAlternative {
  id: string;
  description: string;
  base_version: string;
  choices: Record<string, string>;
  federal: {
    base: Record<string, number>;
    alternative: Record<string, number>;
    total_tax_change: number;
    penalty_change?: number;
  };
  california: {
    base: Record<string, number>;
    alternative: Record<string, number>;
    total_tax_change: number;
    penalty_change?: number;
  };
  changed_lines: Array<{
    key: string;
    base: number | string;
    alternative: number | string;
  }>;
  note?: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  event: string;
  actor: string | null;
  detail: string | null;
  refs?: string[];
}

export interface PacketData {
  packet: PacketMeta;
  readme: Record<string, any>;
  household: HouseholdData;
  documents: DocumentRecord[];
  extracted_values: ExtractedValue[];
  client: {
    questionnaire: QuestionnaireItem[];
    messages: ClientMessage[];
    call_notes: CallNote[];
  };
  firm: FirmData;
  prior_years: {
    return_2024: {
      lines: Record<string, number | string>;
      line_labels: Record<string, string>;
      line_sources: Record<string, string>;
      notes: string[];
      dependents: Array<{ name: string; ssn: string; relationship: string }>;
      K1_1120S: Record<string, any>;
      K1_1065: Record<string, any>;
    };
    prior_preparer_workpaper: {
      summary_memo: string;
      preparer_notes: string[];
      open_items: string[];
    };
    asset_records: Array<Record<string, any>>;
    basis_records: Record<string, any>;
    carryovers_into_2025: {
      federal: Record<string, number>;
      california: Record<string, any>;
    };
  };
  tax_agency_records: {
    irs_account_transcript_2025: Array<{
      as_of: string;
      transactions: Array<{
        date: string;
        code: string | number;
        description: string;
        amount: number | string;
      }>;
    }>;
    ftb_account: {
      as_of: string;
      tax_year_2025_payments: Array<{ date: string; amount: number }>;
      tax_year_2024_payments_after_filing: Array<{ date: string; amount: number; note: string }>;
    };
    notices: Array<{
      id: string;
      agency: string;
      type: string;
      tax_year: number;
      dated: string;
      response_due?: string;
      summary?: string;
      status?: string;
      items_under_examination?: string[];
      document: string;
    }>;
    efile: Array<{
      date: string;
      jurisdiction: string;
      submission_id: string;
      status: string;
      errors?: Array<{ code: string; message: string }>;
    }>;
  };
  timeline: TimelineEvent[];
  engine_reference: {
    parameters: Record<string, any>;
    rules: Record<string, string>;
  };
  return_versions: ReturnVersion[];
  what_if: {
    alternatives: WhatIfAlternative[];
    extension: Record<string, any>;
  };
  planning_reference_2026: Record<string, any>;
  post_filing_rates: Record<string, any>;
  fx_rates: Record<string, any>;
}

// ============================================================================
// WORKPAPER STATE & AUDIT GRAPH TYPES
// ============================================================================

export type TaxEffectCategory =
  | 'wages'
  | 'interest'
  | 'schc_profit'
  | 'stcg'
  | 'ltcg'
  | 'ordinary_income'
  | 'adjustment'
  | 'salt'
  | 'itemized'
  | 'ca_source_income'
  | 'payment_federal'
  | 'payment_california'
  | 'identity_only';

export interface WorkpaperAdjustment {
  id: string;
  lineKey: string;
  lineLabel: string;
  jurisdiction: 'federal' | 'california' | 'both';
  originalValue: number | string;
  adjustedValue: number | string;
  delta: number;
  category: TaxEffectCategory;
  federalTaxEffect: number;
  californiaTaxEffect: number;
  reason: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  evidenceRefs: string[];
  findingId?: string;
  status: 'active' | 'reverted';
}

export type VerificationType =
  | 'agreed_to_source'
  | 'recomputed'
  | 'agreed_to_prior_year'
  | 'client_confirmed'
  | 'judgment_approved'
  | 'immaterial_passed';

export interface VerificationStamp {
  lineKey: string;
  type: VerificationType;
  verifiedById: string;
  verifiedByName: string;
  verifiedAt: string;
  note?: string;
  evidenceRefs: string[];
}

export interface ReviewNote {
  id: string;
  areaId: WorkpaperAreaId;
  lineKey?: string;
  documentId?: string;
  title: string;
  body: string;
  severity: 'blocking' | 'review' | 'fyi';
  status: 'open' | 'addressed' | 'cleared';
  authorId: string;
  authorName: string;
  assignedToId: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedByName?: string;
  resolutionNote?: string;
}

export type WorkpaperAreaId =
  | 'intake_and_engagement'
  | 'wages_and_stock_compensation'
  | 'investments_and_digital_assets'
  | 'business'
  | 'rentals_and_sale'
  | 'pass_throughs_and_basis'
  | 'retirement_and_foreign'
  | 'deductions_and_credits'
  | 'california'
  | 'payments_and_filing';

export interface AreaSignOff {
  areaId: WorkpaperAreaId;
  areaLabel: string;
  preparerSignOff: {
    signed: boolean;
    byId?: string;
    byName?: string;
    at?: string;
    reopenedReason?: string;
  };
  reviewerSignOff: {
    signed: boolean;
    byId?: string;
    byName?: string;
    at?: string;
    reopenedReason?: string;
  };
  partnerSignOff: {
    signed: boolean;
    byId?: string;
    byName?: string;
    at?: string;
    reopenedReason?: string;
  };
  actualHours: number;
  budgetHours: number;
}

export interface AuditFinding {
  id: string;
  number: number;
  title: string;
  category: 'extraction_error' | 'engine_double_count' | 'tax_law_violation' | 'omitted_item' | 'state_sourcing' | 'agency_mismatch' | 'identity_blocker';
  severity: 'critical' | 'high' | 'medium';
  areaId: WorkpaperAreaId;
  lineKey: string;
  lineLabel: string;
  engineValue: number | string;
  correctValue: number | string;
  dollarDelta: number;
  taxEffectCategory: TaxEffectCategory;
  estimatedFedTaxEffect: number;
  estimatedCaTaxEffect: number;
  summary: string;
  rootCause: string;
  howDesignSurfacedIt: string;
  evidenceRefs: string[];
  primaryDocId: string;
  primaryPage: number;
  irsAuditLinked?: boolean;
}

export interface ClientQuestionItem {
  id: string;
  areaId: WorkpaperAreaId;
  lineKey?: string;
  question: string;
  askedById: string;
  askedByName: string;
  askedAt: string;
  status: 'pending_client' | 'answered_evidence_linked';
  clientAnswer?: string;
  answeredBy?: string;
  answeredAt?: string;
  evidenceRef?: string;
}

export interface SensitiveDataLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  targetField: string;
  action: 'unmasked_ssn' | 'unmasked_bank' | 'exported_workpaper' | 'viewed_ip_pin';
}

export interface JudgmentElectionRecord {
  id: string;
  areaId: WorkpaperAreaId;
  title: string;
  authority: string;
  optionsConsidered: string;
  positionTaken: string;
  confidenceLevel: 'more_likely_than_not' | 'substantial_authority' | 'reasonable_basis';
  documentedBy: string;
  documentedAt: string;
  evidenceRefs: string[];
}
