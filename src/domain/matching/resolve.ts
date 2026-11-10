import { ITEM_BY_ID } from "../methodology/question-bank";
import { hobbyItemFromId } from "../methodology/hobby";
import type { Item, ResponseRecord } from "../methodology/types";

export function resolveItemById(id: string, responses: ResponseRecord[]): Item | undefined {
  return ITEM_BY_ID.get(id) ?? hobbyItemFromId(id) ?? responses.find((r) => r.itemId === id)?.generatedItem;
}
