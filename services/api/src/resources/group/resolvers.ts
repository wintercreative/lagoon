import * as R from 'ramda';
import validator from 'validator';
import * as logger from '../../logger';
import { isPatchEmpty } from '../../util/db';
import { GroupNotFoundError } from '../../models/group';
import * as projectHelpers from '../project/helpers';
import { OpendistroSecurityOperations } from './opendistroSecurity';
import { getEnvironmentsByProjectId } from '../environment/resolvers';

export const getAllGroups = async (
  root,
  { name },
  { hasPermission, dataSources, keycloakGrant },
) => {
  try {
    await hasPermission('group', 'viewAll');

    if (name) {
      const group = await dataSources.GroupModel.loadGroupByName(name);
      return [group];
    } else {
      return await dataSources.GroupModel.loadAllGroups();
    }
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

  let parentGroupId: string;
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
  { input: { name, currency } },
  { dataSources, hasPermission },
) => {
  await hasPermission('group', 'add');

  if (!name) {
    throw new Error('You must provide a Billing Group name');
  }

  if (!currency) {
    throw new Error('You must provide a Currency for the Billing Group');
  }

  const gData = {
    name,
    attributes: { type: ['billing'], currency: [currency] },
  };
  return dataSources.GroupModel.addGroup(gData);
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
    const { attributes } = group;
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

export const getAllProjectsByGroupId = async (root, input, context) =>
  getAllProjectsInGroup(root, { input: { id: root.id } }, { ...context });

export const getAllProjectsInGroup = async (
  _root,
  { input: groupInput },
  { dataSources, sqlClient, hasPermission },
) => {
  await hasPermission('group', 'viewAll');
  const {
    GroupModel: { loadGroupByIdOrName, getProjectsFromGroupAndSubgroups },
  } = dataSources;
  const group = await loadGroupByIdOrName(groupInput);
  const projectIdsArray = await getProjectsFromGroupAndSubgroups(group);
  return projectIdsArray.map(async id =>
    projectHelpers(sqlClient).getProjectByProjectInput({ id }),
  );
};

type Project = {
  id: number;
  name: string;
  giturl: string;
  subfolder: string;
  activesystemsdeploy: string;
  activesystemsremove: string;
  branches: string;
  productionenvironment: string;
  autoidle: number;
  storagecalc: number;
  pullrequests: string;
  openshift: number;
  openshiftprojectpattern: string;
};

export const getBillingGroupCost = async (root, args, context) => {
  const projects = await Promise.all(
    await getAllProjectsInGroup(root, args, context),
  );
  const getEnvsFromPid = async id => Promise.all(await getEnvironmentsByProjectId({ id }, args, context));
  const projectMapFn = async project => ({
    ...project,
    environments: await Promise.all(await getEnvsFromPid(project.id)),
  });

  const projectsWithEnvironments = projects.map(projectMapFn);
  console.log(await Promise.all(projectsWithEnvironments));

  const availabilityFilterFn = (filterKey: string) => ({ availability }) =>
    availability === filterKey;
  const highAvailabilityProjectsInGroup = projects.filter(
    availabilityFilterFn('HIGH'),
  );
  const standardAvailabilityProjectsInGroup = projects.filter(
    availabilityFilterFn('STANDARD'),
  );

  // TODO - Get all environments for the project
  // getEnvironmentsByProjectId

  // TODO - for each environment loop through and call
  // getEnvironmentStorageMonthByEnvironmentId
  // getEnvironmentHoursMonthByEnvironmentId
  // getEnvironmentHitsMonthByEnvironmentId
  // services/api/src/resources/environment/resolvers.js

  const projectCostFn = project => ({
    id: project.id,
    name: project.name,
    hits: 1000,
    storage: 1000,
    hours: {
      prod: 10,
      dev: 20,
    },
  });

  return {
    availability: {
      high: {
        hitCost: 1_000_000,
        storageCost: 1_000_000,
        hoursCost: 1_000_000,
        projects: [highAvailabilityProjectsInGroup.map(projectCostFn)],
      },
      standard: {
        hitCost: 1_000_000,
        storageCost: 1_000_000,
        hoursCost: 1_000_000,
        projects: [standardAvailabilityProjectsInGroup.map(projectCostFn)],
      },
    },
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
