import request from "@/utils/request";

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post("/auth/login", data),
  register: (data: {
    username: string;
    password: string;
    confirmPassword: string;
  }) => request.post("/auth/register", data),
  logout: () => request.post("/auth/logout"),
  changePassword: (data: Record<string, string>) =>
    request.put("/auth/password", data),
};

export const lotteryModeApi = {
  list: () => request.get("/lottery-modes"),
};

export const numbersApi = {
  generateBatch: (data: { modeId: number; count: number }) =>
    request.post("/numbers/generate-batch", data),
};

export const drawTicketApi = {
  list: (params: Record<string, unknown>) =>
    request.get("/draw-tickets", { params }),
  create: (data: Record<string, unknown>) =>
    request.post("/draw-tickets", data),
  createBatch: (data: Record<string, unknown>[]) =>
    request.post("/draw-tickets/batch", data),
  update: (id: number, data: Record<string, unknown>) =>
    request.put(`/draw-tickets/${id}`, data),
  delete: (id: number) => request.delete(`/draw-tickets/${id}`),
  updateWinStatus: (id: number, data: Record<string, unknown>) =>
    request.put(`/draw-tickets/${id}/win-status`, data),
};

export const drawResultApi = {
  list: (params: Record<string, unknown>) =>
    request.get("/draw-results", { params }),
  create: (data: Record<string, unknown>) =>
    request.post("/draw-results", data),
  winCheck: (id: number) => request.post(`/draw-results/${id}/win-check`),
};

export const scratchTicketApi = {
  list: (params: Record<string, unknown>) =>
    request.get("/scratch-tickets", { params }),
  create: (data: Record<string, unknown>) =>
    request.post("/scratch-tickets", data),
  update: (id: number, data: Record<string, unknown>) =>
    request.put(`/scratch-tickets/${id}`, data),
  delete: (id: number) => request.delete(`/scratch-tickets/${id}`),
};

export const statisticsApi = {
  overview: (params: Record<string, unknown>) =>
    request.get("/statistics/overview", { params }),
  advanced: (params: Record<string, unknown>) =>
    request.get("/statistics/advanced", { params }),
  trend: (params: Record<string, unknown>) =>
    request.get("/statistics/trend", { params }),
  modeDistribution: (params: Record<string, unknown>) =>
    request.get("/statistics/mode-distribution", { params }),
  scratchTrend: (params: Record<string, unknown>) =>
    request.get("/statistics/scratch-trend", { params }),
};

/**
 * 默认号码 API
 * 用于管理和获取预设的默认投注号码
 */
export const defaultNumberApi = {
  /** 获取所有默认号码 */
  list: () => request.get("/default-numbers"),
  /** 根据彩票模式ID获取默认号码列表 */
  listByModeId: (modeId: number) => request.get(`/default-numbers/mode/${modeId}`),
  /** 新增默认号码 */
  create: (data: Record<string, unknown>) => request.post("/default-numbers", data),
  /** 更新默认号码 */
  update: (id: number, data: Record<string, unknown>) =>
    request.put(`/default-numbers/${id}`, data),
  /** 删除默认号码 */
  delete: (id: number) => request.delete(`/default-numbers/${id}`),
};
