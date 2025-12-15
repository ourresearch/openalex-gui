<template>
  <Card class="w-[215px] mr-6 mb-6">
    <img :src="person.img" :alt="person.name" class="w-full max-h-[210px] object-cover" />
    <CardHeader class="p-4 pb-2">
      <CardTitle class="text-base">{{ person.name }}</CardTitle>
      <CardDescription v-if="section == 'staff'">{{ person.title }}</CardDescription>
    </CardHeader>
    <CardFooter class="justify-end p-4 pt-0">
      <Dialog v-model:open="dialogIsOpen">
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">more</Button>
        </DialogTrigger>
        <DialogContent class="max-w-[500px]">
          <div class="flex flex-col items-center -mt-4">
            <Avatar class="h-48 w-48">
              <AvatarImage :src="person.img" alt="" />
              <AvatarFallback>{{ person.name?.charAt(0) }}</AvatarFallback>
            </Avatar>

            <h2 class="text-xl font-bold mt-4">{{ person.name }}</h2>

            <div class="mt-1">
              <span class="font-bold">{{ person.title }}</span>
              <span>({{ person.fte }})</span>
            </div>
          </div>

          <div v-if="person.links" class="flex justify-center gap-1">
            <span v-for="(link, i) in person.links" :key="i">
              <a :href="link.href" class="text-primary hover:underline">{{ link.anchor }}</a>
              <span class="text-muted-foreground mx-1" v-if="i < person.links.length - 1">|</span>
            </span>
          </div>

          <div v-html="person.bio" class="px-5 py-5"></div>

          <DialogFooter>
            <Button variant="ghost" @click="dialogIsOpen = false">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardFooter>
  </Card>
</template>

<script setup>
import { ref } from 'vue';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

defineOptions({ name: 'PersonCard' });

defineProps({
  person: Object,
  section: String,
});

const dialogIsOpen = ref(false);
</script>

<style scoped>
</style>