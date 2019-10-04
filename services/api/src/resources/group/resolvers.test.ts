import { promisify } from 'util';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as faker from 'faker';
import {
  ADD_PROJECT,
  ADD_BILLING_GROUP,
  UPDATE_BILLING_GROUP,
  DELETE_BILLING_GROUP,
  ADD_PROJECT_TO_BILLING_GROUP,
  UPDATE_PROJECT_BILLING_GROUP,
  REMOVE_PROJECT_FROM_BILLING_GROUP,
} from './mutations';

const exec = promisify(require('child_process').exec);

const GRAPHQL_ENDPOINT = 'http://localhost:3000';

type Project = {
  name?: string;
  gitUrl?: string;
  openshift?: number;
  productionEnvironment?: string;
  availability?: string;
};

type Group = {
  name?: string;
  currency?: string;
  billingSoftware?: string;
};

const defaultProject: Project = {
  name: 'PLACEHOLDER',
  gitUrl: 'http://github.com',
  openshift: 1,
  productionEnvironment: 'master',
  availability: 'STANDARD',
};

const defaultBillingGroup: Group = {
  name: 'PLACEHOLDER',
  currency: 'USD',
  billingSoftware: 'Bexio',
};

const requestConfig = {
  baseURL: GRAPHQL_ENDPOINT,
  timeout: 20000,
  headers: {
    Authorization: '',
    'content-type': 'application/json',
  },
};

const getJWTToken = async () => {
  try {
    const { stdout: jwtToken, stderr } = await exec(
      'docker-compose exec -T auto-idler /create_jwt.sh',
    );
    if (stderr) {
      throw stderr;
    }
    return jwtToken;
  } catch (err) {
    console.error(err);
  }
};

let axiosInstance: AxiosInstance;

type GroupResult = {
  name?: string;
  type: string;
  currency: string;
  billingSoftware: string;
  projects?: [Project];
};

type ProjectResult = {
  name?: string;
  groups?: [Group];
};

type DataResult = {
  addNewProject: ProjectResult;
  addNewBillingGroup: GroupResult;
  updateBillingGroup: GroupResult;
  deleteBillingGroup: { deleteGroup: 'success' };
  data: {
    addProjectToBillingGroup: ProjectResult;
    updateProjectBillingGroup: ProjectResult;
    removeProjectFromBillingGroup: ProjectResult;
  };
  errors?: any;
  // [key: string]: ProjectResult | GroupResult;
};

type AxiosResponseGraphQL = Promise<AxiosResponse<DataResult>>;
type AxiosGraphQL = (query: String, variables?: any) => AxiosResponseGraphQL;

const graphql: AxiosGraphQL = (query: String, variables?: any) =>
  axiosInstance.post('/graphql', {
    query,
    ...(variables ? { variables } : {}),
  });

const QUERIES = {
  ALL_PROJECTS_FILTERED_BY_GIT_URL: {
    query: `
      query allProjects {
        allProjects(gitUrl:"test"){
          id
          gitUrl
          name
          availability
          groups{
            ...on BillingGroup {
              name
            }
          }
        }
      }
    `,
    expected: {
      data: {
        allProjects: [
          {
            id: 18,
            gitUrl: 'test',
            name: 'high-cotton',
            availability: 'HIGH',
            groups: [
              {
                name: 'High Cotton Billing Group',
              },
              {},
              {},
            ],
          },
        ],
      },
    },
  },
  GET_PROJECT_FILTERED_BY_NAME: {
    query: `
      query getProject {
        projectByName(name:"high-cotton"){
          id
          name
          availability
          groups{
            name
            ...on BillingGroup{
              name
              currency
            }
          }
        }
      }
    `,
    expected: {
      data: {
        projectByName: {
          id: 18,
          name: 'high-cotton',
          availability: 'HIGH',
          groups: [
            {
              name: 'High Cotton Billing Group',
              currency: 'USD',
            },
            {
              name: 'project-high-cotton',
            },
            {
              name: 'ui-customer',
            },
          ],
        },
      },
    },
  },
  ALL_GROUPS_FILTERED_BY_BILLING_TYPE: {
    query: `
      query allGroups {
        allGroups(type:"billing"){
          name
          type
          ...on BillingGroup {
            currency
          }
          projects{
            id
            name
          }
        }
      }
    `,
    expected: {
      name: 'High Cotton Billing Group',
      type: 'billing',
      currency: 'USD',
      projects: [
        {
          id: 18,
          name: 'high-cotton',
        },
      ],
    },
  },
  ALL_PROJECTS_IN_GROUP: {
    query: `
      query allProjectsInGroup($input:GroupInput) {
        allProjectsInGroup(input: $input){
          name
        }
      }
    `,
    variables: { input: { name: 'High Cotton Billing Group' } },
    expected: {
      data: {
        allProjectsInGroup: [
          {
            name: 'high-cotton',
          },
        ],
      },
    },
  },
  BILLING_GROUP_COST: {
    query: `
      query billingGroupCost($input: GroupInput, $month: String) {
        billingGroupCost(input: $input, month: $month)
      }
    `,
    variables: {
      input: { name: 'High Cotton Billing Group' },
      month: '2019-08',
    },
    expected: {
      data: {
        billingGroupCost: {
          currency: 'USD',
          availability: {
            high: {
              hitCost: 213.03,
              storageCost: 1.4,
              environmentCost: {
                prod: 206.68,
                dev: 0,
              },
              projects: [
                {
                  id: '18',
                  name: 'high-cotton',
                  availability: 'HIGH',
                  month: 7,
                  year: 2019,
                  hits: 343446,
                  storageDays: 197,
                  prodHours: 1488,
                  devHours: 744,
                  environments: {
                    '0': {
                      id: '3',
                      name: 'Master',
                      type: 'production',
                      hits: {
                        hits: 0,
                      },
                      storage: {
                        bytesUsed: null,
                        month: null,
                      },
                      hours: {
                        month: '2019-08',
                        hours: 0,
                      },
                    },
                    '1': {
                      id: '4',
                      name: 'Staging',
                      type: 'development',
                      hits: {
                        hits: 0,
                      },
                      storage: {
                        bytesUsed: null,
                        month: null,
                      },
                      hours: {
                        month: '2019-08',
                        hours: 0,
                      },
                    },
                    '2': {
                      id: '5',
                      name: 'Development',
                      type: 'development',
                      hits: {
                        hits: 0,
                      },
                      storage: {
                        bytesUsed: null,
                        month: null,
                      },
                      hours: {
                        month: '2019-08',
                        hours: 0,
                      },
                    },
                    '3': {
                      id: '6',
                      name: 'PR-175',
                      type: 'development',
                      hits: {
                        hits: 0,
                      },
                      storage: {
                        bytesUsed: null,
                        month: null,
                      },
                      hours: {
                        month: '2019-08',
                        hours: 0,
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  },
};

const addNewProject = (project: Project) =>
  graphql(ADD_PROJECT, { input: { ...defaultProject, ...project } });

const addNewBillingGroup = (group: Group) =>
  graphql(ADD_BILLING_GROUP, { input: { ...defaultBillingGroup, ...group } });

const updateBillingGroup = (group: Group, patch: Group) =>
  graphql(UPDATE_BILLING_GROUP, {
    input: { group: { ...group }, patch: { ...patch } },
  });

const deleteBillingGroup = (group: Group) =>
  graphql(DELETE_BILLING_GROUP, { input: { group: { ...group } } });

const addProjectToBillingGroup = (project: Project, group: Group) =>
  graphql(ADD_PROJECT_TO_BILLING_GROUP, {
    input: { project: { ...project }, group: { ...group } },
  });

const updateProjectBillingGroup = (project: Project, group: Group) =>
  graphql(UPDATE_PROJECT_BILLING_GROUP, {
    input: { project: { ...project }, group: { ...group } },
  });

const removeProjectFromBillingGroup = (group: Group, project: Project) =>
  graphql(REMOVE_PROJECT_FROM_BILLING_GROUP, {
    input: { group: { ...group }, project: { ...project } },
  });

const cleanup = {
  groups: [],
  projects: [],
};

// Unit Under Test
describe('Billing Group Costs Related Queries & Mutation', () => {
  beforeAll(async () => {
    // GET JWT Token
    const token = (await getJWTToken()).replace(/[\n\t\r]/g, '');
    requestConfig.headers.Authorization = `Bearer ${token}`;
    axiosInstance = axios.create(requestConfig);
  });

  describe('BillingGroup Mutations #mutations', () => {
    // scenarios and expectation

    afterAll(async () => {
      // cleanup.groups.map(group => deleteBillingGroup(group));
      // // cleanup.projects.map(group => deleteProject(project));
    }, 60000);

    it('When I run the mutation addBillingGroup, I expect the name to be returned. #mutaion #addBillingGroup', async () => {
      // Arrange
      const fakeGroupName = faker.random.alphaNumeric(10);
      const expected = {
        data: {
          addBillingGroup: {
            name: fakeGroupName,
          },
        },
      };

      // Act
      const { data } = await addNewBillingGroup({ name: fakeGroupName });

      if (!data.addNewBillingGroup) {
        throw new Error(data.errors[0].message);
      }

      // Assert
      expect(data).toMatchObject(expected);

      // cleanup
      // cleanup.groups.push({ name: fakeGroupName });
    }, 10000);

    it('When I update a billing group name, currency, and billing software, I expect the result to reflect this. #mutation #updateBillingGroup', async () => {
      // Arrange
      const fakeGroupName = faker.random.alphaNumeric(10);
      const fakeGroupNameUpdate = faker.random.alphaNumeric(10);
      await addNewBillingGroup({ name: fakeGroupName });

      const group = { name: fakeGroupName };
      const patch = {
        name: fakeGroupNameUpdate,
        currency: 'AUD',
        billingSoftware: 'Bexio',
      };

      const expected = {
        data: {
          updateBillingGroup: {
            name: fakeGroupNameUpdate,
            type: 'billing',
            currency: 'AUD',
            billingSoftware: 'Bexio',
          },
        },
      };

      // Act
      const { data } = await updateBillingGroup(group, patch);

      if (!data.updateBillingGroup) {
        throw new Error(data.errors[0].message);
      }

      // Assert
      expect(data).toMatchObject(expected);

      // cleanup
      // cleanup.groups.push(group);
    }, 10000);

    it('When I delete a billing group, I expect it to go away. #mutation #deleteGroup', async () => {
      // Arrange
      const fakeGroupName = faker.random.alphaNumeric(10);
      await addNewBillingGroup({ name: fakeGroupName });
      const expected = {
        data: {
          deleteGroup: 'success',
        },
      };

      // Act
      const { data } = await deleteBillingGroup({ name: fakeGroupName });

      if (!data.deleteBillingGroup) {
        throw new Error(data.errors[0].message);
      }

      // Assert
      expect(data).toMatchObject(expected);
    }, 30000);

    it('When I add a project with STANDARD availability, the expect STANDARD to be returned. #mutation #addProject', async () => {
      // Arrange
      const fakeProjectName = faker.random.alphaNumeric(10);
      const expected = {
        data: {
          addProject: {
            name: fakeProjectName,
            availability: 'STANDARD',
          },
        },
      };

      // Act
      const { data } = await addNewProject({ name: fakeProjectName });

      if (!data.addNewProject) {
        throw new Error(data.errors[0].message);
      }

      // Assert
      expect(data).toMatchObject(expected);

      // cleanup
      // cleanup.projects.push({ name: fakeProjectName });
    });

    it("When I add a project to a billing group, I should see that project returned in the billing groups' projects array. #mutation #addProjectToBillingGroup", async () => {
      // Arrange
      const project = { name: faker.random.alphaNumeric(10) };
      const group = { name: faker.random.alphaNumeric(10) };

      await addNewProject(project);
      await addNewBillingGroup(group);

      // Act
      const { data } = await addProjectToBillingGroup(project, group);

      const expected = {
        data: {
          addProjectToBillingGroup: {
            name: project.name,
            groups: [{ name: `project-${project.name}` }, { name: group.name }],
          },
        },
      };

      // sort the resulting group array otherwise the array order can throw off the test
      const nameSortFn = (a, b) => (a.name > b.name ? 1 : -1);
      data.data.addProjectToBillingGroup.groups.sort(nameSortFn);
      expected.data.addProjectToBillingGroup.groups.sort(nameSortFn);

      if (!data.data.addProjectToBillingGroup) {
        throw new Error(data.errors[0].message);
      }

      // Assert
      expect(data).toMatchObject(expected);

      // cleanup
      // cleanup.groups.push(group);
      // cleanup.projects.push(project);
    }, 30000);

    it("When I update the billing group associated to a project, I should see that project in the new billing group's projects. #mutation #updateProjectBillingGroup", async () => {
      // Arrange
      const project = { name: faker.random.alphaNumeric(10) };
      const group = { name: faker.random.alphaNumeric(10) };
      const group2 = { name: faker.random.alphaNumeric(10) };

      await addNewProject(project);
      await addNewBillingGroup(group);
      await addNewBillingGroup(group2);
      await addProjectToBillingGroup(project, group);

      // Act
      const { data } = await updateProjectBillingGroup(project, group2);

      if (!data.data.updateProjectBillingGroup) {
        throw new Error(data.errors[0].message);
      }

      // Assert
      expect(data.data.updateProjectBillingGroup.groups).toContainEqual(group2);

      // cleanup
      // cleanup.groups.push(group);
      // cleanup.groups.push(group2);
      // cleanup.projects.push(project);
    }, 120000);

    it("When I remove a project from a billing group, I shouldn't see that project in the billing group's project list. #mutation #removeProjectFromBillingGroup", async () => {
      // Arrange
      const project = { name: faker.random.alphaNumeric(10) };
      const group = { name: faker.random.alphaNumeric(10) };

      await addNewProject(project);
      await addNewBillingGroup(group);
      await addProjectToBillingGroup(project, group);

      // Act
      const { data } = await removeProjectFromBillingGroup(group, project);

      if (!data.data.removeProjectFromBillingGroup) {
        throw new Error(data.errors[0].message);
      }

      // Assert
      expect(data.data.removeProjectFromBillingGroup.groups.length).toBe(1);
    }, 30000);
  });

  describe('BillingGroup Related Queries #queries', () => {
    // scenarios and expectation

    it('When I query for all projects, filtered by the "test" gitUrl, I expect the result to match the query signature. #query #allProjects', async () => {
      // Arrange
      const { query, expected } = QUERIES.ALL_PROJECTS_FILTERED_BY_GIT_URL;

      // Act
      const response = await graphql(query);
      const { data } = response ? response : null;

      // Assert
      expect(data).toMatchObject(expected);
    });

    it('When I query for the "high-cotton" project by name, I expect the result to match the query signature. #query #projectByName', async () => {
      // Arrange
      const { query, expected } = QUERIES.GET_PROJECT_FILTERED_BY_NAME;

      // Act
      const response = await axiosInstance.post('/graphql', { query });
      const { data } = response ? response : null;

      // Assert
      expect(data).toMatchObject(expected);
    });

    it('When I query for all groups filtered by billing type, I expect "High Cotton Billing Group" to be in the returned result. #query #allGroups', async () => {
      // Arrange
      const { query, expected } = QUERIES.ALL_GROUPS_FILTERED_BY_BILLING_TYPE;

      // Act
      const response = await axiosInstance.post('/graphql', { query });
      const { data } = response ? response : null;
      // Assert
      expect(data.allGroups).toContainEqual(expected);
    });

    it('When I query for all projects in a group, I expect the result to match the query signature. #query #allProjectsInGroup', async () => {
      // Arrange
      const { query, expected, variables } = QUERIES.ALL_PROJECTS_IN_GROUP;
      const data = { query, variables };

      // Act
      const response = await axiosInstance.post('/graphql', data);
      const { data: responseData } = response ? response : null;

      // Assert
      expect(responseData).toMatchObject(expected);
    });

    it('When I query for the billing group cost, I expect the result to match the test data for hits, storage, and environment hours. #query #billingGroupCost', async () => {
      // Arrange
      const { query, expected, variables } = QUERIES.BILLING_GROUP_COST;
      const data = { query, variables };

      // Act
      const response = await axiosInstance.post('/graphql', data);
      const { data: responseData } = response ? response : null;

      // Assert
      expect(responseData).toMatchObject(expected);
    });
  });
});

// QUERY TEMPLATE
/*
  it('', async () => {
    // Arrange
    const { query, expected } = QUERIES.

    // Act
    const response = await axiosInstance.post('/graphql', { query });
    const { data } = response ? response : null;

    // Assert
    expect(data).toMatchObject(expected);
  });
  */

// MUTATION TEMPLATE
/*
  it('', async () => {
    // Arrange
    const { query, variables, expected } = MUTATIONS.;
    const data = { query, variables };
    // Act
    const response = await axiosInstance.post('/graphql', data);
    const { data: responseData } = response ? response : null;
    // Assert
    expect(responseData).toMatchObject(expected);
  });
  */
