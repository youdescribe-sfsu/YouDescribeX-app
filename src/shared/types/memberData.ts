export interface MemberData {
  name: string
  bio: string
  img: string
  designation: string
  pdf: string
  tenure: string
  year: number | 'present'
  description: string
  externalLink?: string
  externalLinkTitle?: string
}
