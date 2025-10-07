import { combineReducers } from 'redux';

import AuthReducer from './auth/reducer';

const rootReducer = combineReducers({
    Auth: AuthReducer,
});

export default rootReducer;
