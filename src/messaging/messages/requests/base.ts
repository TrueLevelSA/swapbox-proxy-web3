export class RequestBase {
  public static REQUEST_BACKEND = "backend";
  public static REQUEST_ORDER = "order";

  constructor(readonly request: string) {}
}
