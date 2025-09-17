import clsx from "clsx"
import { MonitorIcon, SmartphoneIcon } from "lucide-react"
import { useRef } from "react"
import { ColorHelper } from "../../../helpers/ColorHelper"
import { DeviceManager, DeviceType } from "../../../helpers/DeviceManager"
import cl from "../DiscoverPage.module.css"
import { IDevice } from "../helpers/useDeviceList"

interface IProps {
  device: IDevice
  onClick: (device: IDevice) => void
}

export function DeviceButton({ device, onClick }: IProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isYou = device.id === DeviceManager.getId()

  const iconColor = ref.current
    ? ColorHelper.getTextColor(
        window.getComputedStyle(ref.current).backgroundColor
      )
    : "white"

  return (
    <div
      key={device.id}
      className={clsx(cl.device, isYou && cl.disabled)}
      onClick={() => !isYou && onClick(device)}
    >
      <div
        ref={ref}
        className={cl.icon}
        style={{ backgroundColor: device.name.split(" ")[0] }}
      >
        {device.device === DeviceType.mobile ? (
          <SmartphoneIcon color={iconColor} />
        ) : (
          <MonitorIcon color={iconColor} />
        )}
      </div>
      {device.name} {isYou && "(you)"}
    </div>
  )
}
