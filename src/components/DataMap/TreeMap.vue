<template>
  <div class="tree-map pa-12 mb-8">
    <div class="tree-map-header text-center">
      <div class="text-h4 text-center mb-4">
        <span>{{ filters.titleCase(schema.entity) }}</span>
        <span v-if="treeMapData" class="text-grey-darken-1 ml-1">({{ filters.millify(treeMapData[0].value) }})</span>
      </div> 

      <div class="division-selector">
        <v-chip
          v-for="division in schema.divisions"
          :key="division"
          class="mr-2"
          :color="selectedDivisions.includes(division) ? entityConfig.color : 'grey'"
          @click="selectedDivisions = [division]"
        >
          {{ division in fieldLabels ? fieldLabels[division][0] : division }}
        </v-chip>
      </div>
    </div>
    
    <VChart
      v-if="treeMapData"
      :option="chartOptions"
      autoresize
      style="height: 70vh;"
    />
    <div v-else>
      <v-skeleton-loader 
        color="blue" 
        type="card"
        class="ma-12"
        height="500">
      </v-skeleton-loader>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import colors from 'material-colors';

import { use } from 'echarts/core';
import VChart from 'vue-echarts';
import { TreemapChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import { getConfigs } from '@/oaxConfigs';
import filters from '@/filters';

defineOptions({ name: 'TreeMap' });

const { schema } = defineProps({
  schema: Object
});

use([CanvasRenderer, TreemapChart, TitleComponent, TooltipComponent]);

const entityConfig = getConfigs()[schema.entity];

const getColor = (color, saturation) => colors[color][saturation];

const data = ref(null);
const selectedDivisions = ref([schema.divisions[0]]);

const fieldLabels = {
  "type": ["Type"],
  "open_access.is_oa": ["Open Access", "Open Access", "Closed Access"],
  "open_access.any_repository_has_fulltext": ["Fulltext", "Has Fulltext", "No Fulltext"],
  "authorships.institutions.is_global_south": ["Global South", "Global South", "Global North"],
  "last_known_institutions.country_code": ["Country"],
  "has_orcid": ["ORCID", "Has ORCID", "No ORCID"],
  "country_code": ["Country"],
  "country_codes": ["Country"],
}

const treeMapData = computed(() => {
  if (!data.value) return null;

  return data.value.map(item => {
    const division = selectedDivisions.value[0];
    return {
      name: '',
      value: item.value,
      children: item.divisions[division]?.map(child => {
        const fieldLabel = fieldLabels[division];
        return {
          name: fieldLabel && fieldLabel.length > 1 ? (child.name === 'true' ? fieldLabel[1] : fieldLabel[2]) : child.name,
          value: child.value
        }
      }) || []
    };
  });
});

const chartOptions = computed(() => {
  if (!treeMapData.value) return null;

  return {
    title: {
    },
    color: getColor(entityConfig.color, 200),
    colorSaturation: [0.7, 0.6],
    tooltip: {
      formatter(info) {
        const path = info.treePathInfo?.slice(2).map(i => i.name).join(' > ') ?? '';
        return (
          `<div class="tooltip-title"><b>${path}</b></div>` +
          `<div>${filters.millify(data.value[0].value)}</div>` +
          `<div>${((info.value /data.value[0].value) * 100).toFixed(2)}%</div>`
        );
      }
    },
    series: [
      {
        type: 'treemap',
        data: treeMapData.value,
        label: {
          show: true,
          formatter: '{b}'
        },
        upperLabel: {
          show: true,
          height: 30
        },
        itemStyle: {
          borderColor: '#fff'
        },
        levels: [
          {
            // Level 0 (top-level): hide label
            label: { show: false },
            upperLabel: { show: false }
          }
        ],
        top: 10,
        bottom: 0,
        left: 0,
        right: 0,
        leafDepth: 2,              // allow zoom up to 2 levels deep
        nodeClick: 'zoom',  
        breadcrumb: {
          show: false,
        }, 
      }
    ],
    rootPath: [treeMapData.value[0].name, treeMapData.value[0].children?.[0]?.name]
  };
});

const axiosConfig = {headers: {Authorization: "Bearer YWMKSvdNwfrknsOPtdqCPz"}};

async function loadData() {
  const itemData = {
    name: schema.entity,
    value: 0,
    divisions: {}
  };

  const baseUrl = `https://api.openalex.org/${schema.entity}`;
  const response = await axios.get(baseUrl, axiosConfig);
  itemData.value = response.data.meta.count;

  const divisionPromises = schema.divisions.map(division => {
    const groupUrl = `${baseUrl}?group_by=${division}`;
    return axios.get(groupUrl, axiosConfig).then(groupRes => {
      itemData.divisions[division] = groupRes.data.group_by.map(item => ({
        name: item.key_display_name,
        value: item.count
      }));
    });
  });

  await Promise.all(divisionPromises);
  return [itemData]; // Return as array to maintain compatibility with existing code
}

onMounted(async () => {
  data.value = await loadData();
  console.log("Data: ", schema.entity, data.value);
  console.log("treeMapData", schema.entity, treeMapData.value);
});
</script>

<style scoped>
.tooltip-title {
  font-weight: bold;
  margin-bottom: 5px;
}
</style>