interface EventVO {
  id: string
  title: string
  details: string
  images: string
  level: number
  startTime: string
  endTime: string
  status: EventStatus
  createTime: string
  updateTime: string
}
enum EventStatus {
  NOT_STARTED = 0,
  STARTED = 1,
  ENDED = 2,
}
