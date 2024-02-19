export class RequestBase {
  public static METHOD_BACKEND = "backend";
  public static METHOD_ORDER = "buy";

  constructor(readonly method: string) {}
}
