
/**
 * 获取AI机器人列表
 * @param token 登录令牌
 */
export function getAiRobotList(
  token: string,
) {
  return useHttp.get<Result<RobotUserVO[]>>(
    `/chat/ai/robot/list`,
    {},
    { headers: { Authorization: token } },
  );
}


/**
 * 机器人用户视图对象
 *
 * RobotUserVO
 */
export interface RobotUserVO {
  /**
   * AI模型代码
   */
  aiModelCode: number;
  /**
   * 用户昵称
   */
  nickname: string;
  /**
   * 用户头像URL
   */
  avatar?: string;
  /**
   * 用户是否被使用
   */
  isUsed?: boolean;
  /**
   * 用户ID
   */
  userId: string;
  /**
   * 用户名
   */
  username: string;
}
