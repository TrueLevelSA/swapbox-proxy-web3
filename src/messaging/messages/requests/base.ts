export class RequestBase {
  public static METHOD_BACKEND = "backend";
  public static METHOD_ORDER = "buy";
  public static METHOD_PRICEQUOTE = "pricequote";

  constructor(readonly method: string) {}
}
