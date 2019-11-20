/*
  Run against local setup via the following commands on your host machine:

  getAllProjectsNotInBillingGroup
  $ docker-compose exec -T api sh -c './node_modules/.bin/tsc && node dist/helpers/billingGroups.js getAllProjectsNotInBillingGroup'

  getAllBillingGroupsWithoutProjects
  $ docker-compose exec -T api sh -c './node_modules/.bin/tsc && node dist/helpers/billingGroups.js getAllBillingGroupsWithoutProjects'

  deleteAllBillingGroupsWithoutProjects
  $ docker-compose exec -T api sh -c './node_modules/.bin/tsc && node dist/helpers/billingGroups.js deleteAllBillingGroupsWithoutProjects'
*/

import * as R from 'ramda';
import * as projectHelpers from '../resources/project/helpers';
//import { logger } from '@lagoon/commons/src/local-logging';
import { getSqlClient } from '../clients/sqlClient';
import { getKeycloakAdminClient } from '../clients/keycloak-admin';
import { Group, BillingGroup } from '../models/group';
// import { keycloakAdminClient } from '../clients/keycloakClient';

const keycloakAuth = {
  username: 'admin',
  password: R.pathOr(
    '<password not set>',
    ['env', 'KEYCLOAK_ADMIN_PASSWORD'],
    process,
  ) as string,
  grantType: 'password',
  clientId: 'admin-cli',
};

interface IGroup {
  name: string;
  id?: string;
  type?: string;
  currency?: string;
  path?: string;
  groups?: Group[];
  attributes?: object;
}

export const getAllProjectsNotInBillingGroup = async () => {
  const keycloakAdminClient = await getKeycloakAdminClient();
  const sqlClient = getSqlClient();
  const GroupModel = Group(keycloakAdminClient);

  // GET ALL GROUPS
  const groups = await GroupModel.loadAllGroups();

  // FILTER OUT ONLY BILLING GROUPS
  const groupFilter: (IGroup) => Boolean = group =>
    group.type === 'billing' ? true : false;
  const billingGroups = groups.filter(groupFilter);

  // GET ALL PROJECT IDS FOR ALL PROJECTS IN BILLING GROUPS
  const allProjPids = await Promise.all(
    billingGroups.map(group =>
      GroupModel.getProjectsFromGroupAndSubgroups(group),
    ),
  );
  const reducerFn = (acc, arr) => [...acc, ...arr];
  const pids = allProjPids.reduce(reducerFn, []);

  // SQL QUERY FOR ALL PROJECTS NOT IN ID
  const projects = await projectHelpers(sqlClient).getAllProjectsNotIn(pids);

  return projects.map(project => ({
    id: project.id,
    name: project.name,
  }));
};

export const getAllBillingGroupsWithoutProjects = async () => {
  const keycloakAdminClient = await getKeycloakAdminClient();
  const GroupModel = Group(keycloakAdminClient);

  // Get All Billing Groups
  const groupTypeFilterFn = ({ name, value }, group) => {
    return name === 'type' && value[0] === 'billing';
  };
  const groups = await GroupModel.loadGroupsByAttribute(groupTypeFilterFn);

  // Load All Billing Group Project PIDs
  const groupsWithProjects = await Promise.all(
    (groups as [BillingGroup]).map(async group => {
      const projects = await GroupModel.getProjectsFromGroupAndSubgroups(group);
      return { ...group, projects };
    }),
  );

  // Filter only projects that have zero projects
  const projectFilterFn = ({ projects }) =>
    projects.length === 0 ? true : false;
  const groupsWithoutProjects = groupsWithProjects.filter(projectFilterFn);

  return groupsWithoutProjects.map(group => ({
    id: group.id,
    name: group.name,
  }));
};

export const deleteAllBillingGroupsWithoutProjects = async () => {
  const keycloakAdminClient = await getKeycloakAdminClient();
  const GroupModel = Group(keycloakAdminClient);
  const groups = await getAllBillingGroupsWithoutProjects();
  await Promise.all(
    groups.map(async group => {
      await GroupModel.deleteGroup(group.id);
    }),
  );
  return getAllBillingGroupsWithoutProjects();
};

const main = async arg => {
  let result: any;
  switch (arg) {
    case 'getAllProjectsNotInBillingGroup':
      result = await getAllProjectsNotInBillingGroup();
      break;
    case 'getAllBillingGroupsWithoutProjects':
      result = await getAllBillingGroupsWithoutProjects();
      break;
    case 'deleteAllBillingGroupsWithoutProjects':
      await deleteAllBillingGroupsWithoutProjects();
      result = 'Success - All groups without projects should be deleted';
      break;
    default:
      console.log(
        'Sorry, you need to send along an argument with this command. \r\n getAllProjectsNotInBillingGroup, getAllBillingGroupsWithoutProjects, deleteAllBillingGroupsWithoutProjects',
      );
  }

  console.table(result);
  process.exit();
};

const args = process.argv.slice(2);
if (args[0].length > 0) {
  main(args[0]);
}
