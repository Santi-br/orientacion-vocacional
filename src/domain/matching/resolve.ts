import { ITEM_BY_ID } from "../methodology/question-bank";
import type { Item, ResponseRecord } from "../methodology/types";

export function resolveItemById(id: string, responses: ResponseRecord[]): Item | undefined {
  return ITEM_BY_ID.get(id) ?? responses.find((r) => r.itemId === id)?.generatedItem;
}
