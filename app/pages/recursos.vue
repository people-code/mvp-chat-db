<script setup lang="ts">
interface Doctor {
  id: string
  name: string
  specialty: string
  schedule: string
  createdAt: string
}

interface Product {
  id: string
  name: string
  price: number
  ingredients: string
  createdAt: string
}

const { data: doctors, status: doctorsStatus, error: doctorsError } = await useFetch<Doctor[]>('/api/doctors')
const { data: products, status: productsStatus, error: productsError } = await useFetch<Product[]>('/api/products')

function formatPrice(price: number) {
  return price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
}
</script>

<template>
  <div class="flex-1 space-y-6 overflow-y-auto px-4 py-4">
    <section>
      <h2 class="mb-3 text-sm font-semibold text-neutral-800">Médicos</h2>

      <div v-if="doctorsStatus === 'pending'" class="text-center text-sm text-neutral-400">Cargando…</div>
      <div v-else-if="doctorsError" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        No se pudieron cargar los médicos.
      </div>
      <div v-else-if="!doctors?.length" class="text-center text-sm text-neutral-400">No hay médicos registrados.</div>
      <div v-else class="overflow-x-auto rounded-xl border border-neutral-200">
        <table class="w-full text-left text-sm">
          <thead class="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th class="px-3 py-2 font-medium">Nombre</th>
              <th class="px-3 py-2 font-medium">Especialidad</th>
              <th class="px-3 py-2 font-medium">Horario</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doctor in doctors" :key="doctor.id" class="border-t border-neutral-100">
              <td class="px-3 py-2 text-neutral-800">{{ doctor.name }}</td>
              <td class="px-3 py-2 text-neutral-700">{{ doctor.specialty }}</td>
              <td class="px-3 py-2 text-neutral-500">{{ doctor.schedule }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 class="mb-3 text-sm font-semibold text-neutral-800">Productos</h2>

      <div v-if="productsStatus === 'pending'" class="text-center text-sm text-neutral-400">Cargando…</div>
      <div v-else-if="productsError" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        No se pudieron cargar los productos.
      </div>
      <div v-else-if="!products?.length" class="text-center text-sm text-neutral-400">No hay productos registrados.</div>
      <div v-else class="overflow-x-auto rounded-xl border border-neutral-200">
        <table class="w-full text-left text-sm">
          <thead class="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th class="px-3 py-2 font-medium">Nombre</th>
              <th class="px-3 py-2 font-medium">Precio</th>
              <th class="px-3 py-2 font-medium">Ingredientes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id" class="border-t border-neutral-100">
              <td class="px-3 py-2 text-neutral-800">{{ product.name }}</td>
              <td class="px-3 py-2 whitespace-nowrap text-neutral-700">{{ formatPrice(product.price) }}</td>
              <td class="px-3 py-2 text-neutral-500">{{ product.ingredients }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
