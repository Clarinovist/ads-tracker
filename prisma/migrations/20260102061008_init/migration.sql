-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ad_account_id" TEXT NOT NULL,
    "color_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyInsight" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "frequency" DOUBLE PRECISION NOT NULL,
    "leads" INTEGER NOT NULL,
    "hook_rate" DOUBLE PRECISION NOT NULL,
    "hold_rate" DOUBLE PRECISION NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL,
    "cpl" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_ad_account_id_key" ON "Business"("ad_account_id");

-- CreateIndex
CREATE INDEX "Business_created_at_idx" ON "Business"("created_at");

-- CreateIndex
CREATE INDEX "DailyInsight_business_id_idx" ON "DailyInsight"("business_id");

-- CreateIndex
CREATE INDEX "DailyInsight_date_idx" ON "DailyInsight"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyInsight_business_id_date_key" ON "DailyInsight"("business_id", "date");

-- AddForeignKey
ALTER TABLE "DailyInsight" ADD CONSTRAINT "DailyInsight_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
