
export enum SortOrder {
  asc = 'asc',
  desc = 'desc'
}

export class Sorting {
  sortBy?: string;
  sortOrder?: SortOrder = SortOrder.asc
}
