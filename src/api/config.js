export const getApiUrl = () => {
  const raw = import.meta.env.VITE_API_URL || "https://sistema-para-tienda.cowib.es";
  return raw.replace(/\/+$/, "");
};
