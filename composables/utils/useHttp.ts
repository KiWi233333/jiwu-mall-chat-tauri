import { StatusCodeText } from "~/types/result";

type FetchType = typeof $fetch
type ReqType = Parameters<FetchType>[0]
type FetchOptions = Parameters<FetchType>[1]

export function httpRequest<T = unknown>(
  method: any,
  url: ReqType,
  bodyOrParams?: any,
  opts?: FetchOptions,
) {
  let msg = "";
  const user = useUserStore();
  const defaultOpts = {
    method,
    baseURL: BaseUrl,
    headers: {} as { Authoriztion?: string },
    // 请求拦截器
    onRequest: (config) => {
      // 需要登录操作
      // @ts-expect-error
      if (config.options.headers?.Authorization !== undefined) {
        // @ts-expect-error
        if (config.options.headers?.Authorization === "")
          user.showLoginForm = true;
      }
    },
    onResponse: (coinfig) => {
      const data = coinfig.response._data;
      let msg = "";
      const type = "error";
      const code = data.code as number;
      if (data.code !== StatusCode.SUCCESS)
      // @ts-expect-error
        msg = StatusCodeText[code] || "";
      if (msg !== "") {
        setTimeout(() => {
          ElMessage.closeAll("error");
          // 组件
          ElMessage.error({
            grouping: true,
            type,
            message: data.message.length > 50 ? msg : data.message,
          });
        }, 10);
      }
      // 续签
      // @ts-expect-error
      if (coinfig.response.headers?.Authorization) {
        // @ts-expect-error
        user.token = coinfig.response.headers?.Authorization;
      }
    },
    // 请求错误
    onRequestError() {
      (() => {
        ElMessage.error({
          grouping: true,
          repeatNum: 0,
          message: "请求出错，请重试！",
        });
      })();
    },
    // 不同响应码
    onResponseError({ response }) {
      switch (response.status) {
        case 400:
          msg = "请求参数错误，请稍后重试！";
          break;
        case 401:
          msg = "没有权限，拒绝访问！";
          break;
        case 403:
          msg = "没有权限，拒绝访问！";
          break;
        case 404:
          msg = "请求地址错误！";
          break;
        case 500:
          msg = "服务器故障，稍后重试！";
          break;
      }
      // 客户端报错
      if (msg && document && ElMessage) {
        setTimeout(() => {
          ElMessage.error(msg);
        }, 40);
      }
    },
  } as FetchOptions;
  if (defaultOpts) {
    if (method === "post" || method === "put")
      defaultOpts.body = bodyOrParams;
    else if (method === "delete" || method === "get")
      defaultOpts.params = bodyOrParams;
    else
      defaultOpts.body = bodyOrParams;
  }
  return $fetch<T>(url, { ...defaultOpts, ...opts });
}

export const useHttp = {
  post<T = unknown>(
    request: ReqType,
    body?: any | null | object,
    opts?: FetchOptions,
  ) {
    return httpRequest<T>("post", request, body, opts);
  },

  get<T = unknown>(
    request: ReqType,
    body?: any | null | object,
    opts?: FetchOptions,
  ) {
    return httpRequest<T>("get", request, body, opts);
  },


  deleted<T = unknown>(
    request: ReqType,
    body?: any | null | object,
    opts?: FetchOptions,
  ) {
    return httpRequest<T>("DELETE", request, body, opts);
  },


  put<T = unknown>(
    request: ReqType,
    body?: any | null | object,
    opts?: FetchOptions,
  ) {
    return httpRequest<T>("put", request, body, opts);
  },

};
