import type { Prisma } from "@prisma/client";
import prisma from "./prisma";
import {
  computeNextSeqForEntity,
  formatSntDocumentNumber,
  normalizeEntityCode,
  resolveOwnerNameFromEntity,
  SntDocKind,
  SntEntityCode,
} from "./snt-doc-numbering";

type PrismaTx = Prisma.TransactionClient | typeof prisma;

/**
 * Mengalokasikan nomor dokumen resmi berikutnya secara atomik di PostgreSQL
 * untuk kombinasi (Jenis Dokumen × Entitas):
 *   - INV/{LPD|RE|MTC}/SNT-W2/{NNN}/{ROMAWI}/{YYYY}
 *   - KW/{LPD|RE|MTC}/SNT-W2/{NNN}/{ROMAWI}/{YYYY}
 */
export async function allocateNextSntDocNumber(
  tx: PrismaTx,
  params: {
    kind: SntDocKind;
    entityCode: SntEntityCode | string;
    date: Date | string;
    preferredSeq?: number;
  }
): Promise<{ docNumber: string; seq: number; entityCode: SntEntityCode; defaultOwner: string }> {
  const entity = normalizeEntityCode(params.entityCode);
  const prefix = `${params.kind}/${entity}/SNT-W2`;

  const existingNumbers =
    params.kind === "KW"
      ? (
          await tx.kwitansiRecord.findMany({
            where: { noKwitansi: { startsWith: prefix } },
            select: { noKwitansi: true },
          })
        ).map((r) => r.noKwitansi)
      : (
          await tx.invoiceRecord.findMany({
            where: { noInvoice: { startsWith: prefix } },
            select: { noInvoice: true },
          })
        ).map((r) => r.noInvoice);

  let seq =
    params.preferredSeq && Number.isFinite(params.preferredSeq) && params.preferredSeq > 0
      ? Math.floor(params.preferredSeq)
      : computeNextSeqForEntity(existingNumbers, params.kind, entity);

  let candidate = formatSntDocumentNumber(params.kind, entity, seq, params.date);

  // Jaga keunikan penuh bila ada nomor dengan tanggal/urutan sama
  for (let guard = 0; guard < 50; guard++) {
    const conflict =
      params.kind === "KW"
        ? await tx.kwitansiRecord.findUnique({
            where: { noKwitansi: candidate },
            select: { id: true },
          })
        : await tx.invoiceRecord.findUnique({
            where: { noInvoice: candidate },
            select: { id: true },
          });
    if (!conflict) break;
    seq += 1;
    candidate = formatSntDocumentNumber(params.kind, entity, seq, params.date);
  }

  return {
    docNumber: candidate,
    seq,
    entityCode: entity,
    defaultOwner: resolveOwnerNameFromEntity(entity),
  };
}
