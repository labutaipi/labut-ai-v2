-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "confirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "zona" TEXT;
