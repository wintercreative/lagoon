import * as R from 'ramda';
import validator from 'validator';
import * as logger from '../../logger';
import { isPatchEmpty } from '../../util/db';
import { GroupNotFoundError } from '../../models/group';
import { OpendistroSecurityOperations } from './opendistroSecurity';
import { KeycloakUnauthorizedError } from '../../util/auth';

const projectHelpers = require('../project/helpers');

export const getAllGroups = async (
  root,
  { name, type },
  { hasPermission, models, keycloakGrant }
) => {
  try {
    await hasPermission('group', 'viewAll');

    if (name) {
      const group = await models.GroupModel.loadGroupByName(name);
      return [group];
    } else {
      const groups = await models.GroupModel.loadAllGroups();
      const filterFn = (key, val) => group => group[key].includes(val);
      const filteredByName = groups.filter(filterFn('name', name));
      const filteredByType = groups.filter(filterFn('type', type));
      return name || type ? R.union(filteredByName, filteredByType) : groups;
    }
  } catch (err) {
    if (name && err instanceof GroupNotFoundError) {
      throw err;
    }

    if (err instanceof KeycloakUnauthorizedError) {
      if (!keycloakGrant) {
        logger.warn('Access denied to user for getAllGroups');
        return [];
      } else {
        const user = await models.UserModel.loadUserById(
          keycloakGrant.access_token.content.sub
        );
        const userGroups = await models.UserModel.getAllGroupsForUser(user);

        if (name) {
          return R.filter(R.propEq('name', name), userGroups);
        } else {
          return userGroups;
        }
      }
    }

    logger.warn(`getAllGroups failed unexpectedly: ${err.message}`);
    throw err;
  }
};

export const getGroupsByProjectId = async (
  { id: pid },
  _input,
  { hasPermission, models, keycloakGrant }
) => {
  const projectGroups = await models.GroupModel.loadGroupsByProjectId(pid);

  try {
    await hasPermission('group', 'viewAll');

    return projectGroups;
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getGroupsByProjectId');
      return [];
    }

    const user = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub
    );
    const userGroups = await models.UserModel.getAllGroupsForUser(user);
    const userProjectGroups = R.intersection(projectGroups, userGroups);

    return userProjectGroups;
  }
};

export const getGroupsByUserId = async (
  { id: uid },
  _input,
  { hasPermission, models, keycloakGrant }
) => {
  const queryUser = await models.UserModel.loadUserById(uid);
  const queryUserGroups = await models.UserModel.getAllGroupsForUser(queryUser);

  try {
    await hasPermission('group', 'viewAll');

    return queryUserGroups;
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getGroupsByUserId');
      return [];
    }

    const currentUser = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub
    );
    const currentUserGroups = await models.UserModel.getAllGroupsForUser(
      currentUser
    );
    const bothUserGroups = R.intersection(queryUserGroups, currentUserGroups);

    return bothUserGroups;
  }
};

export const getGroupByName = async (
  _,
  { name },
  { dataSources, hasPermission }
) => {
  await hasPermission('group', 'viewAll');
  return await dataSources.GroupModel.loadGroupByIdOrName({ name });
};

export const addGroup = async (
  _root,
  { input },
  { models, sqlClient, hasPermission }
) => {
  await hasPermission('group', 'add');

  if (validator.matches(input.name, /[^0-9a-z-]/)) {
    throw new Error(
      'Only lowercase characters, numbers and dashes allowed for name!'
    );
  }

  let parentGroupId: string | undefined = undefined;
  if (R.has('parentGroup', input)) {
    if (R.isEmpty(input.parentGroup)) {
      throw new Error('You must provide a group id or name');
    }

    const parentGroup = await models.GroupModel.loadGroupByIdOrName(
      input.parentGroup
    );
    parentGroupId = parentGroup.id;
  }

  const group = await models.GroupModel.addGroup({
    name: input.name,
    ...(parentGroupId ? { parentGroupId } : {})
  });

  // We don't have any projects yet. So just an empty string
  await OpendistroSecurityOperations(sqlClient, models.GroupModel).syncGroup(
    input.name,
    ''
  );

  return group;
};

export const updateGroup = async (
  _root,
  { input: { group: groupInput, patch } },
  { models, hasPermission }
) => {
  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'update', {
    group: group.id
  });

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  if (typeof patch.name === 'string') {
    if (validator.matches(patch.name, /[^0-9a-z-]/)) {
      throw new Error(
        'Only lowercase characters, numbers and dashes allowed for name!'
      );
    }
  }

  const updatedGroup = await models.GroupModel.updateGroup({
    id: group.id,
    name: patch.name
  });

  return updatedGroup;
};

export const deleteGroup = async (
  _root,
  { input: { group: groupInput } },
  { models, sqlClient, hasPermission }
) => {
  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'delete', {
    group: group.id
  });

  await models.GroupModel.deleteGroup(group.id);

  await OpendistroSecurityOperations(sqlClient, models.GroupModel).deleteGroup(
    group.name
  );

  return 'success';
};

export const deleteAllGroups = async (
  _root,
  _args,
  { models, hasPermission }
) => {
  await hasPermission('group', 'deleteAll');

  const groups = await models.GroupModel.loadAllGroups();

  let deleteErrors: String[] = [];
  for (const group of groups) {
    try {
      await models.GroupModel.deleteGroup(group.id);
    } catch (err) {
      deleteErrors = [...deleteErrors, `${group.name} (${group.id})`];
    }
  }

  return R.ifElse(R.isEmpty, R.always('success'), deleteErrors => {
    throw new Error(`Could not delete groups: ${deleteErrors.join(', ')}`);
  })(deleteErrors);
};

export const addUserToGroup = async (
  _root,
  { input: { user: userInput, group: groupInput, role } },
  { models, hasPermission }
) => {
  if (R.isEmpty(userInput)) {
    throw new Error('You must provide a user id or email');
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput)
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a group id or name');
  }

  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'addUser', {
    group: group.id
  });

  await models.GroupModel.removeUserFromGroup(user, group);
  const updatedGroup = await models.GroupModel.addUserToGroup(
    user,
    group,
    role
  );

  return updatedGroup;
};

export const removeUserFromGroup = async (
  _root,
  { input: { user: userInput, group: groupInput } },
  { models, hasPermission }
) => {
  if (R.isEmpty(userInput)) {
    throw new Error('You must provide a user id or email');
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput)
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a group id or name');
  }

  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'removeUser', {
    group: group.id
  });

  const updatedGroup = await models.GroupModel.removeUserFromGroup(user, group);

  return updatedGroup;
};

export const addGroupsToProject = async (
  _root,
  { input: { project: projectInput, groups: groupsInput } },
  { models, sqlClient, hasPermission }
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput
  );

  await hasPermission('project', 'addGroup', {
    project: project.id
  });

  if (R.isEmpty(groupsInput)) {
    throw new Error('You must provide groups');
  }

  const groupsInputNotEmpty = R.filter(R.complement(R.isEmpty), groupsInput);

  if (R.isEmpty(groupsInputNotEmpty)) {
    throw new Error('One or more of your groups is missing an id or name');
  }

  for (const groupInput of groupsInput) {
    const group = await models.GroupModel.loadGroupByIdOrName(groupInput);
    await models.GroupModel.addProjectToGroup(project.id, group);
  }

  const syncGroups = groupsInput.map(async groupInput => {
    const updatedGroup = await models.GroupModel.loadGroupByIdOrName(
      groupInput
    );
    const projectIdsArray = await models.GroupModel.getProjectsFromGroupAndSubgroups(
      updatedGroup
    );
    const projectIds = R.join(',')(projectIdsArray);
    OpendistroSecurityOperations(sqlClient, models.GroupModel).syncGroup(
      updatedGroup.name,
      projectIds
    );
  });

  try {
    await Promise.all(syncGroups);
  } catch (err) {
    throw new Error(
      `Could not sync groups with opendistro-security: ${err.message}`
    );
  }

  return await projectHelpers(sqlClient).getProjectById(project.id);
};

export const addBillingGroup = async (
  _root,
  { input: { name, currency, billingSoftware } },
  { models, hasPermission }
) => {
  await hasPermission('group', 'add');

  if (!name) {
    throw new Error('You must provide a Billing Group name');
  }

  if (!currency) {
    throw new Error('You must provide a Currency for the Billing Group');
  }

  return models.GroupModel.addGroup({
    name,
    attributes: {
      type: ['billing'],
      currency: [currency],
      ...(billingSoftware ? { billingSoftware: [billingSoftware] } : {})
    }
  });
};

export const updateBillingGroup = async (
  _root,
  { input: { group: groupInput, patch } },
  { models, hasPermission }
) => {
  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);
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
    ...(billingSoftware ? { billingSoftware: [billingSoftware] } : {})
  };

  const groupPatch = { ...group, name, attributes: updatedAttributes };
  const updatedGroup = await models.GroupModel.updateGroup(groupPatch);

  return updatedGroup;
};

export const addProjectToBillingGroup = async (
  _root,
  { input: { project: projectInput, group: groupInput } },
  { models, sqlClient, hasPermission }
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput
  );

  await hasPermission('project', 'addGroup', {
    project: project.id
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a billing group name or id');
  }

  const { loadGroupsByProjectId, addProjectToGroup } = models.GroupModel;

  // Billing groups for this project
  const projectGroups = await loadGroupsByProjectId(project.id);

  const projectBillingGroups = projectGroups.filter(group => {
    const { attributes } = group;
    return !!('type' in attributes && attributes.type[0] === 'billing');
  });

  // A project can only be added to a single billing group.
  if (projectBillingGroups.length > 0) {
    throw new Error(
      `Project already added to billing group: ${projectBillingGroups[0].id}`
    );
  }

  // const group = await loadGroupByIdOrName(groupInput);
  await addProjectToGroup(project.id, groupInput);
  return 'success';
};

export const updateProjectBillingGroup = async (
  _root,
  { input: { project: projectInput, group: groupInput } },
  { models, sqlClient, hasPermission }
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput
  );

  await hasPermission('project', 'addGroup', {
    project: project.id
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a billing group name or id');
  }

  const {
    loadGroupsByProjectId,
    loadGroupByIdOrName,
    addProjectToGroup
  } = models.GroupModel;

  // Get all billing groups for this project
  const projectGroups = await loadGroupsByProjectId(project.id);
  const billingGroupFilterFn = group =>
    'type' in group.attributes && group.attributes.type[0] === 'billing';
  const projectBillingGroups = projectGroups.filter(billingGroupFilterFn);

  for (const group of projectBillingGroups) {
    await models.GroupModel.removeProjectFromGroup(project.id, group);
  }

  const group = await loadGroupByIdOrName(groupInput);
  await addProjectToGroup(project.id, group);
  return projectHelpers(sqlClient).getProjectById(project.id);
};

export const removeProjectFromBillingGroup = async (
  root,
  { input: { project, group } },
  context
) =>
  removeGroupsFromProject(
    root,
    { input: { project, groups: [group] } },
    context
  );

export const getAllProjectsByGroupId = async (root, _, context) =>
  getAllProjectsInGroup(root, { input: { id: root.id } }, { ...context });

export const getAllProjectsInGroup = async (
  _root,
  { input: groupInput },
  { models, sqlClient, hasPermission }
) => {
  await hasPermission('group', 'viewAll');
  const {
    GroupModel: { loadGroupByIdOrName, getProjectsFromGroupAndSubgroups }
  } = models;
  const group = await loadGroupByIdOrName(groupInput);
  const projectIdsArray = await getProjectsFromGroupAndSubgroups(group);
  return projectIdsArray.map(async id =>
    projectHelpers(sqlClient).getProjectByProjectInput({ id })
  );
};

/**
 * Given a billingGroup name|id, and month, get the costs for hits, storage,
 *    and prod/dev environment costs
 *
 * @param {obj} root The rootValue passed from the Apollo server configuration.
 * @param {obj} args {input: GroupInput { id: String, name: String}, month: string}
 * @param {ExpressContext} context this includes the context passed from the apolloServer query
 *     { sqlClient, hasPermissions, keycloakGrant, requestCache }
 *
 * @return {JSON} A JSON object that includes the billing costs, projects, and environments
 */
export const getBillingGroupCost = async (_, args, context) => {
  const { models, hasPermission, sqlClient } = context;
  const { input: groupInput, month: yearMonth } = args;

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a billing group name or id');
  }

  await hasPermission('group', 'viewAll');

  return await models.GroupModel.billingGroupCost(groupInput, yearMonth);
};

/**
 * Get the costs for costs for all billing groups
 *
 * @param {obj} root The rootValue passed from the Apollo server configuration.
 * @param {obj} args {month: string}
 * @param {ExpressContext} context this includes the context passed from the apolloServer query
 *     { sqlClient, hasPermissions, keycloakGrant, requestCache }
 *
 * @return {JSON} A JSON object
 */
export const getAllBillingGroupsCost = async (root, args, context) => {
  const { models, hasPermission } = context;
  const { input: groupInput, month: yearMonth } = args;

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a billing group name or id');
  }

  await hasPermission('group', 'viewAll');

  return await models.GroupModel.allBillingGroupCosts(yearMonth);
};

export const removeGroupsFromProject = async (
  _root,
  { input: { project: projectInput, groups: groupsInput } },
  { models, sqlClient, hasPermission }
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput
  );

  await hasPermission('project', 'removeGroup', {
    project: project.id
  });

  if (R.isEmpty(groupsInput)) {
    throw new Error('You must provide groups');
  }

  const groupsInputNotEmpty = R.filter(R.complement(R.isEmpty), groupsInput);

  if (R.isEmpty(groupsInputNotEmpty)) {
    throw new Error('One or more of your groups is missing an id or name');
  }

  for (const groupInput of groupsInput) {
    const group = await models.GroupModel.loadGroupByIdOrName(groupInput);
    await models.GroupModel.removeProjectFromGroup(project.id, group);
  }

  const syncGroups = groupsInput.map(async groupInput => {
    const updatedGroup = await models.GroupModel.loadGroupByIdOrName(
      groupInput
    );
    // @TODO: Load ProjectIDs of subgroups as well
    const projectIdsArray = await models.GroupModel.getProjectsFromGroupAndSubgroups(
      updatedGroup
    );
    const projectIds = R.join(',')(projectIdsArray);
    OpendistroSecurityOperations(sqlClient, models.GroupModel).syncGroup(
      updatedGroup.name,
      projectIds
    );
  });

  try {
    await Promise.all(syncGroups);
  } catch (err) {
    throw new Error(
      `Could not sync groups with opendistro-security: ${err.message}`
    );
  }

  return await projectHelpers(sqlClient).getProjectById(project.id);
};
