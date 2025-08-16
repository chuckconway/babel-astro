export interface WithLangProp {
  lang: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  prevHref?: string;
  nextHref?: string;
  class?: string;
}
