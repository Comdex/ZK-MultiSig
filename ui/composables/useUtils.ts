import { MessageReactive, useMessage } from "naive-ui";

export default function () {
  const message = useMessage();

  const messageReactive = ref<MessageReactive | null>(null);

  const removeLoading = () => {
    setTimeout(() => {
      if (messageReactive.value) {
        messageReactive.value.destroy();
        messageReactive.value = null;
      }
    }, 3000);
  };

  const createLoading = (msg?: string) => {
    if (!messageReactive.value) {
      if (msg) {
        messageReactive.value = message.loading(msg, {
          duration: 0,
        });
      } else {
        messageReactive.value = message.loading("Please wait", {
          duration: 0,
        });
      }
    }
  };

  const sliceAddress = (address: string | null, sliceLength: number = 5) =>
    address
      ? `${address.slice(0, sliceLength)}...${address.slice(-sliceLength)}`
      : null;

  const nano2Mina = (m: number | string | bigint): number => {
    return Number(m) / 1000_000_000;
  };

  const mina2Nano = (m: number | string | bigint): number => {
    //return BigInt(m) * BigInt(10) ** BigInt(9);
    return Number(m) * 1000_000_000;
  };

  const isEmptyStr = (str: string | null): boolean => {
    return str == null || str.trim() == "";
  };

  return {
    sliceAddress,
    nano2Mina,
    mina2Nano,
    isEmptyStr,
    createLoading,
    removeLoading,
    message,
  };
}
