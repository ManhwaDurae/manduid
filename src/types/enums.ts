type HashAlgorithm = 'bcrypt' | 'sha256';
type RollType = 'AssociateMember' | 'RegularMember' | 'HonoraryMember' | 'Explusion' | 'PermanentExplusion'
type SchoolRegistration = 'Enrolled' | 'LeaveOfAbsence' | 'Graduated' | 'Expelled'
type Permission = 'root' | 'oidc' | 'roll' | 'executives' | 'applications' | 'oidc.list' | 'oidc.create' | 'oidc.delete' | 'roll.list' | 'roll.create' | 'roll.update' | 'executives.list' | 'executives.types' | 'executives.fire' | 'executives.appoint' | 'applications.list' | 'applications.acceptance_list' | 'applications.detail' | 'applications.accept' | 'applications.reject';
