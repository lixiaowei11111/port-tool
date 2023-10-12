import { type FC, useEffect, useState } from 'react';
import { type ProcessInfo, type PortInfo } from '@/constant/Enum';
// TYPE
import { DataTypeEnum } from '@/constant/Enum';
const Home: FC = () => {
  const [port, setPort] = useState<number>(0);
  const [portInfo, setPortInfo] = useState<ProcessInfo & PortInfo>();
  const getPortList = async () => {
    try {
      const showPortList = await window.electron.ipcRenderer.data(
        DataTypeEnum.SEARCH_PORT,
      );
      setPortInfo(showPortList[0]);
      console.log(showPortList, 'showPortList');
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getPortList();
  }, []);
  return (
    <>
      <span>Home</span>
      <img src={portInfo?.icon} alt="展示icon" />
    </>
  );
};

export default Home;
