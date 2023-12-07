import {cloudinaryCloudNameSetting, DatabasePublicSetting} from '../publicSettings.ts'

const cloudinaryUploadPresetEditorName = 
  new DatabasePublicSetting<string | null>('cloudinary.uploadPresetEditor', null) 

export const getCloudinaryConfig = () => ({
  cloudinary: {
    getCloudName: cloudinaryCloudNameSetting.getOrThrow,
    getUploadPreset: cloudinaryUploadPresetEditorName.getOrThrow,
  },
})
