export const ROLES = {
  ADMIN:            'admin',
  USER:             'user',
  HISTORY_KEEPER:   'history_keeper',
  CEREMONY_KEEPER:  'ceremony_keeper',
};

export const PRACTITIONER_ROLES = [ROLES.HISTORY_KEEPER, ROLES.CEREMONY_KEEPER];

export const STATUS = {
  DRAFT:     'draft',
  PENDING:   'pending_review',
  PUBLISHED: 'published',
  REJECTED:  'rejected',
};

export const STATUS_LABELS = {
  draft:          'Draft',
  pending_review: 'Pending Review',
  published:      'Published',
  rejected:       'Rejected',
};

export const CINEMA_TYPES  = { LIVE: 'live', RECORDED: 'recorded' };
export const IMVUNULO_GENDER = ['male', 'female', 'both', 'child'];
export const DEFAULT_PAGE_SIZE = 20;

export const ROLE_HOME = {
  admin:           '/admin',
  user:            '/',
  history_keeper:  '/practitioner',
  ceremony_keeper: '/practitioner',
};
