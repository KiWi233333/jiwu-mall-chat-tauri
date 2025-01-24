<script lang="ts" setup>
import { ChatFriendMainTypeGroup, ChatFriendMainTypeNewFriend, ChatFriendMainTypeUser } from "#components";


/**
 * 面板适配器
 */
defineProps<{
  data: TheFriendOpt
}>();
const maps: FriendOptTypeMap = ({
  [FriendOptType.User]: ChatFriendMainTypeUser,
  [FriendOptType.NewFriend]: ChatFriendMainTypeNewFriend,
  [FriendOptType.Group]: ChatFriendMainTypeGroup,
});
interface FriendOptTypeMap {
  [property: number]: any
}
</script>

<template>
  <component :is="maps[data.type || FriendOptType.User]" :data="data" v-bind="$attrs" />
</template>

