// 彩票模式
export interface LotteryMode {
  id: number;
  name: string;
  type: "DRAW" | "SCRATCH";
  redCount: number;
  redMin: number;
  redMax: number;
  blueCount?: number;
  blueMin?: number;
  blueMax?: number;
  unitPrice: number;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// 摇奖票
export interface DrawTicket {
  id: number;
  userId: number;
  modeId: number;
  issueNo?: string;
  redNumbers: number[];
  blueNumbers?: number[];
  betAmount: number;
  winStatus: "PENDING" | "WIN" | "NO_WIN";
  winLevel?: number;
  winAmount?: number;
  drawTime?: string;
  winningNumbers?: any; // 中奖号码信息
  createdAt: string;
  updatedAt: string;
}

// 开奖结果
export interface DrawResult {
  id: number;
  modeId: number;
  issueNo: string;
  drawDate: string;
  redNumbers: number[];
  blueNumbers?: number[];
  createdAt: string;
  updatedAt: string;
}

// 刮刮乐
export interface ScratchTicket {
  id: number;
  userId: number;
  modeId: number;
  costAmount: number;
  winAmount: number;
  scratchDate: string;
  createdAt: string;
  updatedAt: string;
}

// 统计数据
export interface StatisticsOverview {
  totalCost: number;
  totalWin: number;
  netProfit: number;
  totalTickets: number;
  winTickets: number;
  winRate: number;
}

// API响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页数据
export interface PageData<T = any> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 用户信息
export interface UserInfo {
  userId: number;
  username: string;
  role: string;
}
