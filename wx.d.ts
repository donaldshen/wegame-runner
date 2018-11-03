declare const canvas: HTMLCanvasElement

declare namespace wx {
  function showToast (config: {
    icon?: 'success' | 'loading' | 'none'
    title: string
  }): void

  namespace types {
    interface Touch {
      clientX: number
      clientY: number
    }
  }
}

declare namespace wxp {
  function downloadFile (config: {
    url: string
  }): Promise<any>

  function request (config: {
    header?: object,
    url: string,
    method?: string,
    data?: object,
    complete?: () => void
  }): Promise<any>

  function showModal (config: {
    title: string,
    content: string,
    showCancel?: boolean,
    confirmText?: string,
  }): Promise<any>

  function login (): Promise<any>

  function getUserCloudStorage (config: {
    keyList: string[]
  }): Promise<{
    KVDataList: KVData[]
  }>

  function getFriendCloudStorage (config: {
    keyList: string[]
  }): Promise<{
    data: UserGameData[]
  }>
}

declare interface KVData {
  key: string
  value: string
}

declare interface UserGameData {
  avatarUrl: string
  nickname: string
  KVDataList: KVData[]
}

declare interface OpenDataContext {
  canvas: HTMLCanvasElement
  postMessage (msg: {
    method: string
    [prop: string]: any
  }): void
}

declare interface UserInfoButton {
  destroy (): void
}

declare interface GameClubButton {
  show (): void
  hide (): void
}
