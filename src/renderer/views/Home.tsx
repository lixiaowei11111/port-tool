import { type FC, useEffect, useState } from 'react';

// TYPE
import { DataTypeEnum } from '@/Common/Enum';
const Home: FC<any> = () => {
  const [port, setPort] = useState<number | number[]>();
  const getPortList = async () => {
    try {
      const showPortList = await window.electron.ipcRenderer.data(
        DataTypeEnum.SEARCH_PORT,
        5,
      );
      console.log(showPortList, 'showPortList');
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getPortList();
  }, []);
  return <>Home</>;
};

export default Home;
