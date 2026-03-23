<script setup>
defineProps({
  stock: { type: Object, required: true },
})
</script>

<template>
  <div class="inventory-card" :class="{ warning: stock.available < 5, danger: stock.available <= 0 }">
    <div class="card-title">{{ stock.name }}</div>
    <div class="card-rows">
      <div class="card-row">
        <span class="label">總庫存</span>
        <span class="value">{{ stock.total_quantity }} {{ stock.unit }}</span>
      </div>
      <div class="card-row">
        <span class="label">出租中</span>
        <span class="value rented">{{ stock.rented_out }} {{ stock.unit }}</span>
      </div>
      <div class="card-row">
        <span class="label">可用</span>
        <span class="value available">{{ stock.available }} {{ stock.unit }}</span>
      </div>
    </div>
    <div v-if="stock.available <= 0" class="badge danger-badge">庫存不足</div>
    <div v-else-if="stock.available < 5" class="badge warning-badge">庫存偏低</div>
  </div>
</template>

<style scoped>
.inventory-card {
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px 24px;
  min-width: 180px;
  position: relative;
  transition: border-color 0.2s;
}
.inventory-card.warning { border-color: #f59e0b; }
.inventory-card.danger  { border-color: #ef4444; }

.card-title {
  font-size: 22px;
  font-weight: bold;
  color: #1e3a5f;
  margin-bottom: 14px;
  text-align: center;
}

.card-rows { display: flex; flex-direction: column; gap: 8px; }
.card-row { display: flex; justify-content: space-between; align-items: center; }

.label { font-size: 16px; color: #666; }
.value { font-size: 20px; font-weight: bold; color: #333; }
.rented   { color: #2563eb; }
.available { color: #16a34a; }
.inventory-card.warning .available { color: #d97706; }
.inventory-card.danger  .available { color: #dc2626; }

.badge {
  position: absolute;
  top: 12px; right: 12px;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 20px;
}
.warning-badge { background: #fef3c7; color: #92400e; }
.danger-badge  { background: #fee2e2; color: #991b1b; }
</style>
