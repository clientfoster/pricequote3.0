export interface Client {
  _id: string;
  name: string;
  companyName: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  country?: string;
  taxIdName?: string;
  taxIdValue?: string;
  gstin?: string;
}
