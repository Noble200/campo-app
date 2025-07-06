; build-resources/installer.nsh - Sin verificación de espacio
!include "MUI2.nsh"

; Configuración básica
!define APP_NAME "AgroGestión"

; Verificaciones antes de la instalación (SIN verificación de espacio)
!macro customInit
  ; Solo verificar si la aplicación está ejecutándose
  FindWindow $0 "${APP_NAME}" ""
  StrCmp $0 0 app_not_running
    MessageBox MB_OKCANCEL "${APP_NAME} está ejecutándose actualmente.$\n$\n¿Deseas cerrarlo y continuar con la instalación?" IDOK close_app IDCANCEL cancel_install
    close_app:
      SendMessage $0 ${WM_CLOSE} 0 0
      Sleep 2000
      Goto app_not_running
    cancel_install:
      Abort
  app_not_running:
  ; Continuar sin verificar espacio en disco
!macroend

; Durante la instalación
!macro customInstall
  ; Crear accesos directos
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_NAME}.exe"
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_NAME}.exe"
!macroend

; Durante la desinstalación
!macro customUnInstall
  ; Eliminar accesos directos
  Delete "$DESKTOP\${APP_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APP_NAME}"
!macroend