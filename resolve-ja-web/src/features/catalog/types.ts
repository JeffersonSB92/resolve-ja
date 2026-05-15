export type ServiceCategory = {
  id: string;
  name: string;
  slug: string | null;
  active: boolean;
};

export type Service = {
  id: string;
  category_id: string | null;
  name: string | null;
  description: string | null;
  base_price: number | null;
  active: boolean;
  [key: string]: unknown;
};
