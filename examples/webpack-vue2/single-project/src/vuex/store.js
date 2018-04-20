import Vue from 'vue';
import Vuex from 'vuex';
import actions from './actions.js';
import getters from './getters.js';

Vue.use(Vuex);

const state = {
  demoLogs: []
};
const mutations = {
  ADD_DEMO_LOG(st, msg) {
    st.demoLogs.push(msg);
  }
};

export default new Vuex.Store({
  state,
  mutations,
  actions,
  getters
});
