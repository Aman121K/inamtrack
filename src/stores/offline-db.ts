import Dexie, { type Table } from "dexie";

export interface OfflineSale {
  id?: number;
  offlineId: string;
  batchId: string;
  ticketNumber: number;
  customerName: string;
  customerPhone: string;
  createdAt: Date;
  synced: boolean;
}

export interface OfflineBatch {
  id?: number;
  offlineId: string;
  lotteryName: string;
  series: string;
  startNumber: number;
  endNumber: number;
  pricePerTicket: number;
  drawDate: string;
  createdAt: Date;
  synced: boolean;
}

class LotTrackOfflineDB extends Dexie {
  sales!: Table<OfflineSale>;
  batches!: Table<OfflineBatch>;

  constructor() {
    super("lottrack");
    this.version(1).stores({
      sales: "++id, offlineId, batchId, synced",
      batches: "++id, offlineId, synced",
    });
  }
}

export const offlineDb = new LotTrackOfflineDB();

export async function addOfflineSale(sale: Omit<OfflineSale, "id">) {
  return offlineDb.sales.add(sale);
}

export async function getUnsyncedSales(): Promise<OfflineSale[]> {
  return offlineDb.sales.where("synced").equals(0).toArray();
}

export async function markSaleSynced(offlineId: string) {
  await offlineDb.sales.where("offlineId").equals(offlineId).modify({ synced: true });
}

export async function addOfflineBatch(batch: Omit<OfflineBatch, "id">) {
  return offlineDb.batches.add(batch);
}

export async function getUnsyncedBatches(): Promise<OfflineBatch[]> {
  return offlineDb.batches.where("synced").equals(0).toArray();
}

export async function markBatchSynced(offlineId: string) {
  await offlineDb.batches.where("offlineId").equals(offlineId).modify({ synced: true });
}
