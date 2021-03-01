/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Docker from 'dockerode';
import fs from 'fs';
import os from 'os';
import Stream, { PassThrough } from 'stream';
import { runDockerContainer, UserOptions } from './docker';

const mockDocker = new Docker() as jest.Mocked<Docker>;

describe('runDockerContainer', () => {
  beforeEach(() => {
    jest.spyOn(mockDocker, 'pull').mockImplementation((async (
      _image: string,
      _something: any,
      handler: (err: Error | undefined, stream: PassThrough) => void,
    ) => {
      const mockStream = new PassThrough();
      handler(undefined, mockStream);
      mockStream.end();
    }) as any);

    jest
      .spyOn(mockDocker, 'run')
      .mockResolvedValue([{ Error: null, StatusCode: 0 }]);

    jest
      .spyOn(mockDocker, 'ping')
      .mockResolvedValue(Buffer.from('OK', 'utf-8'));
  });

  const imageName = 'dockerOrg/image';
  const args = ['bash', '-c', 'echo test'];
  const inputDir = os.tmpdir();
  const outputDir = os.tmpdir();

  it('should pull the docker container', async () => {
    await runDockerContainer({
      imageName,
      args,
      inputDir,
      outputDir,
      dockerClient: mockDocker,
    });

    expect(mockDocker.pull).toHaveBeenCalledWith(
      imageName,
      {},
      expect.any(Function),
    );
  });

  it('should call the dockerClient run command with the correct arguments passed through', async () => {
    await runDockerContainer({
      imageName,
      args,
      inputDir,
      outputDir,
      dockerClient: mockDocker,
    });

    expect(mockDocker.run).toHaveBeenCalledWith(
      imageName,
      args,
      expect.any(Stream),
      expect.objectContaining({
        HostConfig: {
          Binds: expect.arrayContaining([
            `${await fs.promises.realpath(inputDir)}:/input`,
            `${await fs.promises.realpath(outputDir)}:/output`,
          ]),
        },
        Volumes: {
          '/input': {},
          '/output': {},
        },
      }),
    );
  });

  it('should ping docker to test availability', async () => {
    await runDockerContainer({
      imageName,
      args,
      inputDir,
      outputDir,
      dockerClient: mockDocker,
    });

    expect(mockDocker.ping).toHaveBeenCalled();
  });

  it('should pass through the user and group id from the host machine and set the home dir', async () => {
    await runDockerContainer({
      imageName,
      args,
      inputDir,
      outputDir,
      dockerClient: mockDocker,
    });

    const userOptions: UserOptions = {};
    if (process.getuid && process.getgid) {
      userOptions.User = `${process.getuid()}:${process.getgid()}`;
    }

    expect(mockDocker.run).toHaveBeenCalledWith(
      imageName,
      args,
      expect.any(Stream),
      expect.objectContaining({
        ...userOptions,
      }),
    );
  });

  it('throws a correct error if the command fails in docker', async () => {
    mockDocker.run.mockResolvedValueOnce([
      {
        Error: new Error('Something went wrong with docker'),
        StatusCode: 0,
      },
    ]);

    await expect(
      runDockerContainer({
        imageName,
        args,
        inputDir,
        outputDir,
        dockerClient: mockDocker,
      }),
    ).rejects.toThrow(/Something went wrong with docker/);
  });

  describe('where docker is unavailable', () => {
    const dockerError = 'a docker error';

    beforeEach(() => {
      jest.spyOn(mockDocker, 'ping').mockImplementationOnce(() => {
        throw new Error(dockerError);
      });
    });

    it('should throw with a descriptive error message including the docker error message', async () => {
      await expect(
        runDockerContainer({
          imageName,
          args,
          inputDir,
          outputDir,
          dockerClient: mockDocker,
        }),
      ).rejects.toThrow(new RegExp(`.+: ${dockerError}`));
    });
  });

  it('should pass through the log stream to the docker client', async () => {
    const logStream = new PassThrough();
    await runDockerContainer({
      imageName,
      args,
      inputDir,
      outputDir,
      logStream,
      dockerClient: mockDocker,
    });

    expect(mockDocker.run).toHaveBeenCalledWith(
      imageName,
      args,
      logStream,
      expect.objectContaining({
        HostConfig: {
          Binds: expect.arrayContaining([
            `${await fs.promises.realpath(inputDir)}:/input`,
            `${await fs.promises.realpath(outputDir)}:/output`,
          ]),
        },
        Volumes: {
          '/input': {},
          '/output': {},
        },
      }),
    );
  });
});