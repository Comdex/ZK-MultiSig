export default function () {
  const sliceAddress = (address: string | null, sliceLength: number = 5) =>
    address
      ? `${address.slice(0, sliceLength)}...${address.slice(-sliceLength)}`
      : null;

  const nano2Mina = (m: number | string | bigint): bigint => {
    return BigInt(m) / 1000000000n;
  };

  const mina2Nano = (m: number | string | bigint): bigint => {
    //return BigInt(m) * BigInt(10) ** BigInt(9);
    return BigInt((m as number) * 1000000000);
  };

  const isEmptyStr = (str: string | null): boolean => {
    return str == null || str.trim() == "";
  };

  return {
    sliceAddress,
    nano2Mina,
    mina2Nano,
    isEmptyStr,
  };
}
