import * as R from 'ramda';
import validator from 'validator';
import * as logger from '../../logger';
import { isPatchEmpty } from '../../util/db';
import { GroupNotFoundError } from '../../models/group';
import * as projectHelpers from '../project/helpers';
import { OpendistroSecurityOperations } from './opendistroSecurity';
import {
  getEnvironmentsByProjectId as getEnvironments,
  getEnvironmentStorageMonthByEnvironmentId as getStorage,
  getEnvironmentHoursMonthByEnvironmentId as getHours,
  getEnvironmentHitsMonthByEnvironmentId as getHits,
} from '../environment/resolvers';

import {
  hitsCost as getHitsCost,
  storageCost as getStorageCost,
  prodCost as getProdCost,
  devCost as getDevCost,
} from '../billing/billingCalculations';

export const getAllGroups = async (
  root,
  { name, type },
  { hasPermission, dataSources, keycloakGrant },
) => {
  try {
    await hasPermission('group', 'viewAll');

    const groups = await dataSources.GroupModel.loadAllGroups();
    const filterFn = (key, val) => group => group[key].includes(val);
    const filteredByName = groups.filter(filterFn('name', name));
    const filteredByType = groups.filter(filterFn('type', type));
    return name || type ? R.union(filteredByName, filteredByType) : groups;
  } catch (err) {
    if (err instanceof GroupNotFoundError) {
      return [];
    }

    if (!keycloakGrant) {
      logger.warn('No grant available for getAllGroups');
      return [];
    }

    const user = await dataSources.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub,
    );
    const userGroups = await dataSources.UserModel.getAllGroupsForUser(user);

    if (name) {
      return R.filter(R.propEq('name', name), userGroups);
    } else {
      return userGroups;
    }
  }
};

export const getGroupsByProjectId = async (
  { id: pid },
  _input,
  { hasPermission, dataSources, keycloakGrant },
) => {
  const projectGroups = await dataSources.GroupModel.loadGroupsByProjectId(pid);

  try {
    await hasPermission('group', 'viewAll');

    return projectGroups;
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getGroupsByProjectId');
      return [];
    }

    const user = await dataSources.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub,
    );
    const userGroups = await dataSources.UserModel.getAllGroupsForUser(user);
    const userProjectGroups = R.intersection(projectGroups, userGroups);

    return userProjectGroups;
  }
};

export const getGroupsByUserId = async (
  { id: uid },
  _input,
  { hasPermission, dataSources, keycloakGrant },
) => {
  const queryUser = await dataSources.UserModel.loadUserById(uid);
  const queryUserGroups = await dataSources.UserModel.getAllGroupsForUser(
    queryUser,
  );

  try {
    await hasPermission('group', 'viewAll');

    return queryUserGroups;
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getGroupsByUserId');
      return [];
    }

    const currentUser = await dataSources.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub,
    );
    const currentUserGroups = await dataSources.UserModel.getAllGroupsForUser(
      currentUser,
    );
    const bothUserGroups = R.intersection(queryUserGroups, currentUserGroups);

    return bothUserGroups;
  }
};

export const getGroupByName = async (
  root,
  { name },
  { dataSources, hasPermission },
) => {
  await hasPermission('group', 'viewAll');
  return await dataSources.GroupModel.loadGroupByIdOrName({ name });
};

export const addGroup = async (
  _root,
  { input },
  { dataSources, sqlClient, hasPermission },
) => {
  await hasPermission('group', 'add');

  if (validator.matches(input.name, /[^0-9a-z-]/)) {
    throw new Error(
      'Only lowercase characters, numbers and dashes allowed for name!',
    );
  }

  let parentGroupId = '';
  if (R.has('parentGroup', input)) {
    if (R.isEmpty(input.parentGroup)) {
      throw new Error('You must provide a group id or name');
    }

    const parentGroup = await dataSources.GroupModel.loadGroupByIdOrName(
      input.parentGroup,
    );
    parentGroupId = parentGroup.id;
  }

  const group = await dataSources.GroupModel.addGroup({
    name: input.name,
    parentGroupId,
  });

  // We don't have any projects yet. So just an empty string
  await OpendistroSecurityOperations(
    sqlClient,
    dataSources.GroupModel,
  ).syncGroup(input.name, '');

  return group;
};

export const updateGroup = async (
  _root,
  { input: { group: groupInput, patch } },
  { dataSources, hasPermission },
) => {
  const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'update', {
    group: group.id,
  });

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  if (typeof patch.name === 'string') {
    if (validator.matches(patch.name, /[^0-9a-z-]/)) {
      throw new Error(
        'Only lowercase characters, numbers and dashes allowed for name!',
      );
    }
  }

  const updatedGroup = await dataSources.GroupModel.updateGroup({
    id: group.id,
    name: patch.name,
  });

  return updatedGroup;
};

export const deleteGroup = async (
  _root,
  { input: { group: groupInput } },
  { dataSources, sqlClient, hasPermission },
) => {
  const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'delete', {
    group: group.id,
  });

  await dataSources.GroupModel.deleteGroup(group.id);

  await OpendistroSecurityOperations(
    sqlClient,
    dataSources.GroupModel,
  ).deleteGroup(group.name);

  return 'success';
};

export const deleteAllGroups = async (
  _root,
  _args,
  { dataSources, hasPermission },
) => {
  await hasPermission('group', 'deleteAll');

  const groups = await dataSources.GroupModel.loadAllGroups();
  const groupIds = R.pluck('id', groups);

  const deleteGroups = groupIds.map(
    async id => await dataSources.GroupModel.deleteGroup(id),
  );

  try {
    // Deleting all groups in parallel may cause problems, but this is only used
    // in the tests right now and the number of groups for that use case is low.
    await Promise.all(deleteGroups);
  } catch (err) {
    throw new Error(`Could not delete all groups: ${err.message}`);
  }

  return 'success';
};

export const addUserToGroup = async (
  _root,
  { input: { user: userInput, group: groupInput, role } },
  { dataSources, hasPermission },
) => {
  if (R.isEmpty(userInput)) {
    throw new Error('You must provide a user id or email');
  }

  const user = await dataSources.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput),
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a group id or name');
  }

  const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'addUser', {
    group: group.id,
  });

  await dataSources.GroupModel.removeUserFromGroup(user, group);
  const updatedGroup = await dataSources.GroupModel.addUserToGroup(
    user,
    group,
    role,
  );

  return updatedGroup;
};

export const removeUserFromGroup = async (
  _root,
  { input: { user: userInput, group: groupInput } },
  { dataSources, hasPermission },
) => {
  if (R.isEmpty(userInput)) {
    throw new Error('You must provide a user id or email');
  }

  const user = await dataSources.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput),
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a group id or name');
  }

  const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'removeUser', {
    group: group.id,
  });

  const updatedGroup = await dataSources.GroupModel.removeUserFromGroup(
    user,
    group,
  );

  return updatedGroup;
};

export const addGroupsToProject = async (
  _root,
  { input: { project: projectInput, groups: groupsInput } },
  { dataSources, sqlClient, hasPermission },
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput,
  );

  await hasPermission('project', 'addGroup', {
    project: project.id,
  });

  if (R.isEmpty(groupsInput)) {
    throw new Error('You must provide groups');
  }

  const groupsInputNotEmpty = R.filter(R.complement(R.isEmpty), groupsInput);

  if (R.isEmpty(groupsInputNotEmpty)) {
    throw new Error('One or more of your groups is missing an id or name');
  }

  for (const groupInput of groupsInput) {
    const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);
    await dataSources.GroupModel.addProjectToGroup(project.id, group);
  }

  const syncGroups = groupsInput.map(async groupInput => {
    const updatedGroup = await dataSources.GroupModel.loadGroupByIdOrName(
      groupInput,
    );
    const projectIdsArray = await dataSources.GroupModel.getProjectsFromGroupAndSubgroups(
      updatedGroup,
    );
    const projectIds = R.join(',')(projectIdsArray);
    OpendistroSecurityOperations(sqlClient, dataSources.GroupModel).syncGroup(
      updatedGroup.name,
      projectIds,
    );
  });

  try {
    await Promise.all(syncGroups);
  } catch (err) {
    throw new Error(
      `Could not sync groups with opendistro-security: ${err.message}`,
    );
  }

  return await projectHelpers(sqlClient).getProjectById(project.id);
};

export const addBillingGroup = async (
  _root,
  { input: { name, currency, billingSoftware } },
  { dataSources, hasPermission },
) => {
  await hasPermission('group', 'add');

  if (!name) {
    throw new Error('You must provide a Billing Group name');
  }

  if (!currency) {
    throw new Error('You must provide a Currency for the Billing Group');
  }

  return dataSources.GroupModel.addGroup({
    name,
    attributes: {
      type: ['billing'],
      currency: [currency],
      ...(billingSoftware ? { billingSoftware: [billingSoftware] } : {}),
    },
  });
};

export const updateBillingGroup = async (
  _root,
  { input: { group: groupInput, patch } },
  { dataSources, hasPermission },
) => {
  const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);
  const { id, attributes } = group;

  await hasPermission('group', 'update', { group: id });

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const { name, currency, billingSoftware } = patch;
  const updatedAttributes = {
    ...attributes,
    type: ['billing'],
    ...(currency ? { currency: [currency] } : {}),
    ...(billingSoftware ? { billingSoftware: [billingSoftware] } : {}),
  };

  const groupPatch = { ...group, name, attributes: updatedAttributes };
  const updatedGroup = await dataSources.GroupModel.updateGroup(groupPatch);

  return updatedGroup;
};

export const addProjectToBillingGroup = async (
  _root,
  { input: { project: projectInput, group: groupInput } },
  { dataSources, sqlClient, hasPermission },
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput,
  );

  await hasPermission('project', 'addGroup', {
    project: project.id,
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a billing group name or id');
  }

  const {
    loadGroupsByProjectId,
    loadGroupByIdOrName,
    addProjectToGroup,
  } = dataSources.GroupModel;

  // Billing groups for this project
  const projectGroups = await loadGroupsByProjectId(project.id);

  const projectBillingGroups = projectGroups.filter(group => {
    const { id, attributes } = group;
    return !!('type' in attributes && attributes.type[0] === 'billing');
  });

  // A project can only be added to a single billing group.
  if (projectBillingGroups.length > 0) {
    throw new Error(
      `Project already added to billing group: ${projectBillingGroups[0].id}`,
    );
  }

  const group = await loadGroupByIdOrName(groupInput);
  await addProjectToGroup(project.id, group);
  return projectHelpers(sqlClient).getProjectById(project.id);
};

export const updateProjectBillingGroup = async (
  _root,
  { input: { project: projectInput, group: groupInput } },
  { dataSources, sqlClient, hasPermission },
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput,
  );

  await hasPermission('project', 'addGroup', {
    project: project.id,
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a billing group name or id');
  }

  const {
    loadGroupsByProjectId,
    loadGroupByIdOrName,
    addProjectToGroup,
    removeProjectFromGroup,
  } = dataSources.GroupModel;

  // Get all billing groups for this project
  const projectGroups = await loadGroupsByProjectId(project.id);
  const billingGroupFilterFn = group =>
    'type' in group.attributes && group.attributes.type[0] === 'billing';
  const projectBillingGroups = projectGroups.filter(billingGroupFilterFn);

  for (const group of projectBillingGroups) {
    await dataSources.GroupModel.removeProjectFromGroup(project.id, group);
  }

  const group = await loadGroupByIdOrName(groupInput);
  await addProjectToGroup(project.id, group);
  return projectHelpers(sqlClient).getProjectById(project.id);
};

export const removeProjectFromBillingGroup = async (
  root,
  { input: { project, group } },
  context,
) =>
  removeGroupsFromProject(
    root,
    { input: { project, groups: [group] } },
    context,
  );

export const getAllProjectsByGroupId = async (root, input, context) =>
  getAllProjectsInGroup(root, { input: { id: root.id } }, { ...context });

export const getAllProjectsInGroup = async (_root, args, context) => {
  const { input: groupInput } = args;
  const { dataSources, sqlClient, hasPermission } = context;
  const { GroupModel } = dataSources;

  await hasPermission('group', 'viewAll');

  const group = await GroupModel.loadGroupByIdOrName(groupInput);
  const projectIds = await GroupModel.getProjectsFromGroupAndSubgroups(group);

  const { getProjectByProjectInput } = projectHelpers(sqlClient);
  const getProjectFn = async id => await getProjectByProjectInput({ id });

  return await Promise.all(projectIds.map(getProjectFn));
};

const calculateProjectMetrics = environments => {
  let totalHits = 0; // sm of all hits for production environments only
  let totalStorage = 0; // sum of all storage kilobytes used for a given month
  let totalDevHours = 0; // sum of all dev hours for development environments only
  let totalProdHours = 0; // sum of all prod hours only
  // TODO: REFACTOR THIS!
  Object.entries(environments).forEach(([key, val]: [string, any]) => {
    const { type, hits, storage, hours: envHours } = val;
    const { bytesUsed } = storage;
    if (type === 'production') {
      totalHits += hits.total;
      totalProdHours += envHours.hours;
    } else {
      totalDevHours += envHours.hours;
    }
    totalStorage += bytesUsed === null ? 0 : parseInt(bytesUsed, 10);
  });
  return {
    hits: totalHits,
    storageDays: totalStorage / 1000 / 1000,
    prodHours: totalProdHours,
    devHours: totalDevHours,
  };
};

// TODO: TEMPORARY PLACEHOLDER UNTIL WE HAVE OPENSHIFT DATA
const errorCatcherFn = responseObj => err => ({ ...responseObj });

const getHitsStorageHours = async ({
  openshiftProjectName,
  id,
  args,
  context,
}) => ({
  hits: await getHits({ openshiftProjectName }, args, context).catch(
    errorCatcherFn({ total: 0 }),
  ),
  storage: await getStorage({ id }, args, context).catch(
    errorCatcherFn({ bytesUsed: 0 }),
  ),
  hours: await getHours({ id }, args, context).catch(
    errorCatcherFn({ hours: 0 }),
  ),
});

const filterBy = filterKey => ({ availability }) => availability === filterKey;

export const getBillingGroupCost = async (root, args, context) => {
  const { GroupModel } = context.dataSources;
  const { input } = args;

  const group = await GroupModel.loadGroupByIdOrName(input);

  const monthYear = args.month.split('-');
  const month = monthYear[1];
  const year = monthYear[0];

  const getEnvironmentData = async env => {
    const { id, name, openshiftProjectName, environmentType } = env;
    const dataArgs = { openshiftProjectName, id, args, context };
    const data = await getHitsStorageHours(dataArgs);
    const type = environmentType;
    return { id, name, type, ...data };
  };

  const getProjectEnvironments = async project => {
    const pid = { id: project.id };
    const args = { includeDeleted: true };
    const rawEnvs = await getEnvironments(pid, args, context);
    const environments = await Promise.all(rawEnvs.map(getEnvironmentData));
    return { ...project, environments };
  };

  const projects = await Promise.all(
    (await getAllProjectsInGroup(root, args, context)).map(
      getProjectEnvironments,
    ),
  );

  // High Availabilty Projects
  const hProjects = projects.filter(filterBy('HIGH'));
  // Standard Availability Projects
  const sProjects = projects.filter(filterBy('STANDARD'));

  const projectCostFn = project => {
    const { id, availability, environments, name } = project;
    const projectData = calculateProjectMetrics(environments);
    const projectFields = { id, name, availability, month, year };
    return { ...projectFields, ...projectData, environments };
  };

  const getProjectCosts = projects => {
    const projectsWithCost = projects.map(projectCostFn);
    const billingGroup = {
      projects: projectsWithCost,
      currency: group.currency,
    };
    const hitCost = getHitsCost(billingGroup);
    const storageCost = getStorageCost(billingGroup);
    const prod = getProdCost(billingGroup);
    const dev = getDevCost(billingGroup);

    const environmentCost = { environmentCost: { prod, dev } };
    return { high: { hitCost, storageCost, environmentCost, projects } };
  };

  const high = hProjects.length > 0 ? getProjectCosts(hProjects) : {};
  const standard = sProjects.length > 0 ? getProjectCosts(sProjects) : {};

  return {
    currency: group.currency,
    availability: { ...high, ...standard },
  };
};

export const removeGroupsFromProject = async (
  _root,
  { input: { project: projectInput, groups: groupsInput } },
  { dataSources, sqlClient, hasPermission },
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput,
  );

  await hasPermission('project', 'removeGroup', {
    project: project.id,
  });

  if (R.isEmpty(groupsInput)) {
    throw new Error('You must provide groups');
  }

  const groupsInputNotEmpty = R.filter(R.complement(R.isEmpty), groupsInput);

  if (R.isEmpty(groupsInputNotEmpty)) {
    throw new Error('One or more of your groups is missing an id or name');
  }

  for (const groupInput of groupsInput) {
    const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);
    await dataSources.GroupModel.removeProjectFromGroup(project.id, group);
  }

  const syncGroups = groupsInput.map(async groupInput => {
    const updatedGroup = await dataSources.GroupModel.loadGroupByIdOrName(
      groupInput,
    );
    // @TODO: Load ProjectIDs of subgroups as well
    const projectIdsArray = await dataSources.GroupModel.getProjectsFromGroupAndSubgroups(
      updatedGroup,
    );
    const projectIds = R.join(',')(projectIdsArray);
    OpendistroSecurityOperations(sqlClient, dataSources.GroupModel).syncGroup(
      updatedGroup.name,
      projectIds,
    );
  });

  try {
    await Promise.all(syncGroups);
  } catch (err) {
    throw new Error(
      `Could not sync groups with opendistro-security: ${err.message}`,
    );
  }

  return await projectHelpers(sqlClient).getProjectById(project.id);
};
