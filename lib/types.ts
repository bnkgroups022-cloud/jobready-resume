export type Job = {
  id: string;
  slug: string;
  title: string;
  category: string;
  min_qualification_rank: number;
  key_skills: string[];
  optional_skills: string[];
  responsibilities: string[];
  learn_suggestions: string[];
  objective_fresher: string | null;
  objective_experienced: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type Qualification = {
  id: string;
  name: string;
  rank: number;
  group_name: string;
  is_active?: boolean;
  sort_order?: number;
};

export type Template = {
  slug: string;
  name: string;
  description: string | null;
  is_pro: boolean;
  is_active?: boolean;
  accent_color: string;
  sort_order?: number;
};

export type EducationItem = { degree: string; institute: string; board: string; year: string; score: string };
export type ExperienceItem = { role: string; company: string; from: string; to: string; current: boolean; points: string[] };
export type CertItem = { name: string; issuer: string; year: string };

export type ResumeData = {
  jobSlug: string;
  jobTitle: string;
  qualificationName: string;
  qualificationRank: number;
  personal: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    dob: string;
    gender: string;
    fatherName: string;
    maritalStatus: string;
    nationality: string;
    linkedin: string;
  };
  objective: string;
  education: EducationItem[];
  skills: string[];
  typingSpeed: string;
  languages: string[];
  experienceType: 'fresher' | 'experienced';
  experience: ExperienceItem[];
  certifications: CertItem[];
  achievements: string[];
  hobbies: string[];
  declaration: boolean;
  template: string;
};

export type CandidateLevel = 'school_fresher' | 'graduate_fresher' | 'experienced';

export type SectionKey =
  | 'objective' | 'experience' | 'skills' | 'education' | 'certifications'
  | 'achievements' | 'languages' | 'hobbies' | 'personal' | 'declaration';

export type UserStatus = {
  loggedIn: boolean;
  email?: string;
  name?: string | null;
  isPro: boolean;
  plan?: string | null;
  expiry?: string | null;
  freeUsed: boolean;
  credits: number;
  isAdmin: boolean;
};
