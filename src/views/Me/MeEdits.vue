<template>
  <div>
    <h1 class="text-xl font-bold mb-2">Edits</h1>
    <div class="text-sm text-muted-foreground mb-4">
      Edits take up to one week to go live; you can track progress here.
    </div>

    <Card class="bg-white">
      <CardContent v-if="isLoading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <div class="mt-4 text-muted-foreground">Loading your edits...</div>
      </CardContent>

      <CardContent v-else-if="error" class="py-8">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
      </CardContent>

      <CardContent v-else-if="!edits.length" class="py-8 text-center text-muted-foreground">
        You haven't submitted any edits yet.
      </CardContent>

      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>Entity Type</TableHead>
            <TableHead>Entity ID</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>New Value</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="edit in edits" :key="edit.id">
            <TableCell>
              {{ edit.entity }}
            </TableCell>
            <TableCell>
              <router-link :to="getEntityLink(edit)" class="text-primary hover:underline">
                {{ formatEntityId(edit.entity_id) }}
              </router-link>
            </TableCell>
            <TableCell>
              <code class="text-xs bg-muted px-1 py-0.5 rounded">{{ edit.property }}</code>
            </TableCell>
            <TableCell>
              <span class="text-xs">{{ formatValue(edit.property_value) }}</span>
            </TableCell>
            <TableCell>
              <Badge
                :variant="edit.is_live ? 'default' : 'secondary'"
                :class="edit.is_live ? 'bg-green-600' : ''"
              >
                {{ getStatus(edit) }}
              </Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div v-if="pagination && pagination.total > pagination.per_page" class="flex justify-center py-4">
        <div class="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            :disabled="page <= 1"
            @click="page--"
          >
            Previous
          </Button>
          <span class="text-sm text-muted-foreground">
            Page {{ page }} of {{ Math.ceil(pagination.total / pagination.per_page) }}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            :disabled="page >= Math.ceil(pagination.total / pagination.per_page)"
            @click="page++"
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { AlertCircle } from 'lucide-vue-next';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { urlBase } from '@/apiConfig';

defineOptions({ name: 'MeEdits' });

useHead({ title: 'Edits' });

const store = useStore();

const edits = ref([]);
const isLoading = ref(false);
const error = ref(null);
const page = ref(1);
const pagination = ref(null);
const perPage = 20;

const userEmail = computed(() => store.getters['user/userEmail']);

const fetchEdits = async () => {
  if (!userEmail.value) {
    error.value = 'You must be logged in to view your edits.';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const offset = (page.value - 1) * perPage;
    const params = new URLSearchParams({
      submitter_email: userEmail.value,
      per_page: perPage,
      offset: offset,
      sort_order: 'desc',
    });

    const response = await axios.get(`${urlBase.correctionsApi}/v2/corrections?${params.toString()}`);
    edits.value = response.data.results || [];
    pagination.value = response.data.pagination || null;
  } catch (err) {
    console.error('Error fetching edits:', err);
    error.value = 'Unable to load your edits. Please try again later.';
    edits.value = [];
  } finally {
    isLoading.value = false;
  }
};

const getEntityLink = (edit) => {
  const entityType = edit.entity === 'locations' ? 'works' : edit.entity;
  return `/${entityType}/${edit.entity_id}`;
};

const formatEntityId = (id) => {
  return id.length > 20 ? `${id.substring(0, 20)}...` : id;
};

const formatValue = (value) => {
  if (typeof value === 'string' && value.length > 50) {
    return `${value.substring(0, 50)}...`;
  }
  return value;
};

const getStatus = (edit) => {
  return edit.is_live ? 'live' : 'submitted';
};

const getStatusColor = (edit) => {
  return edit.is_live ? 'green' : 'grey';
};

watch(page, () => {
  fetchEdits();
});

onMounted(() => {
  fetchEdits();
});
</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>
