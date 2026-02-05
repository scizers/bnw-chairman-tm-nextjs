export interface SalesReportDirectorMetrics {
  activeTeamMembers: number;
  clientMeetings: number;
  cpMeetingsHeadOffice: number;
  cpMeetingsChannelPartner: number;
  salesAchievedAED: number;
}

export interface SalesReportDirector {
  directorId?: string;
  directorName?: string;
  clientId?: string;
  metrics: SalesReportDirectorMetrics;
}

export interface SalesReportSalesHead {
  salesHeadId?: string;
  salesHeadName?: string;
  totalSalesAED?: number;
  directors: SalesReportDirector[];
}

export interface SalesReportGrandTotals {
  activeTeamMembers: number;
  clientMeetings: number;
  cpMeetingsHeadOffice: number;
  cpMeetingsChannelPartner: number;
  salesAchievedAED: number;
}

export interface DailySalesReport {
  id?: string;
  _id?: string;
  reportDate: string;
  createdBy?: string | { _id?: string; id?: string; name?: string };
  approvedBy?: string | { _id?: string; id?: string; name?: string };
  salesHeads: SalesReportSalesHead[];
  grandTotals?: SalesReportGrandTotals;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}
