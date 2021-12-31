import axios from 'axios';

import { Priorities } from '@common/types/entities';
import { BASEURL } from '@common/constants/api';

// TODO replace with what's in styles.ts
const COLORS = {
  ZERO: '#bfc8de',
  ONE: '#2C4A62',
  TWO: '#4F6A80',
  THREE: '#2C5474',
};
const PriorityApi = {
  async createPriorities(token: string) {
    // custom header to allow for token arg
    const _pHeaders = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const priorities = [
      {
        name: Priorities.SELF,
        color: COLORS.ONE,
      },
      {
        name: Priorities.WORK,
        color: COLORS.TWO,
      },
      {
        name: Priorities.RELATIONS,
        color: COLORS.THREE,
      },
    ];

    console.log('creating priorities ... ');
    const [p1, p2, p3] = await Promise.all([
      await axios.post(`${BASEURL}/priority`, priorities[0], _pHeaders),
      await axios.post(`${BASEURL}/priority`, priorities[1], _pHeaders),
      await axios.post(`${BASEURL}/priority`, priorities[2], _pHeaders),
    ]);
    const combined = [p1, p2, p3];
    return combined;
  },

  async getPriorities() {
    const response = await axios.get(`${BASEURL}/priority/find`, headers);
    return response.data;
  },
};

export { PriorityApi };
