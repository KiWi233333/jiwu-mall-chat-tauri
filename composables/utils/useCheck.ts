export function checkEmail(email: string): boolean {
  return /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
};


export function checkPhone(phone: string): boolean {
  return /^1(?:3\d|4[57]|5[0-35-9]|6[56]|7[013678]|8\d|9[89])\d{8}$/.test(phone);
}
