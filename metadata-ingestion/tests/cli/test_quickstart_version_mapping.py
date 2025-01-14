from datahub.cli.quickstart_versioning import (
    QuickstartExecutionPlan,
    QuickstartVersionMappingConfig,
)

example_version_mapper = QuickstartVersionMappingConfig.parse_obj(
    {
        "quickstart_version_map": {
            "default": {"composefile_git_ref": "master", "docker_tag": "latest"},
            "v0.9.6": {
                "composefile_git_ref": "v0.9.6.1",  # this will be overwritten by the cli
                "docker_tag": "v0.9.6.1",
            },
            "v2.0.0": {"composefile_git_ref": "v2.0.1", "docker_tag": "v2.0.0"},
            "v1.0.0": {"composefile_git_ref": "v1.0.0", "docker_tag": "v1.0.0"},
            "stable": {
                "composefile_git_ref": "v1.0.1",
                "docker_tag": "latest",
            },
        },
    }
)


def test_quickstart_version_config():
    execution_plan = example_version_mapper.get_quickstart_execution_plan("v1.0.0")
    expected = QuickstartExecutionPlan(
        docker_tag="v1.0.0",
        composefile_git_ref="v1.0.0",
    )
    assert execution_plan == expected


def test_quickstart_version_config_default():
    execution_plan = example_version_mapper.get_quickstart_execution_plan("v2.0.0")
    expected = QuickstartExecutionPlan(
        docker_tag="v2.0.0",
        composefile_git_ref="v2.0.1",
    )
    assert execution_plan == expected


def test_quickstart_version_config_stable():
    execution_plan = example_version_mapper.get_quickstart_execution_plan("stable")
    expected = QuickstartExecutionPlan(
        docker_tag="latest",
        composefile_git_ref="v1.0.1",
    )
    assert execution_plan == expected


def test_quickstart_forced_stable():
    example_version_mapper.quickstart_version_map["default"] = QuickstartExecutionPlan(
        composefile_git_ref="v1.0.1", docker_tag="latest"
    )
    execution_plan = example_version_mapper.get_quickstart_execution_plan(None)
    expected = QuickstartExecutionPlan(
        docker_tag="latest",
        composefile_git_ref="v1.0.1",
    )
    assert execution_plan == expected


def test_quickstart_forced_not_a_version_tag():
    """
    If the user specifies a version that is not in the version mapping, we should still use the default version for checking.

    This is because the user may be using a version of datahub that is not in the version mapping. Which is most likely
    a recent change, otherwise it should be on an older version of datahub.
    """
    execution_plan = example_version_mapper.get_quickstart_execution_plan(
        "NOT A VERSION"
    )
    expected = QuickstartExecutionPlan(
        docker_tag="NOT A VERSION",
        composefile_git_ref="NOT A VERSION",
    )
    assert execution_plan == expected


def test_quickstart_get_older_version():
    execution_plan = example_version_mapper.get_quickstart_execution_plan("v0.9.6")
    expected = QuickstartExecutionPlan(
        docker_tag="v0.9.6.1",
        composefile_git_ref="1d3339276129a7cb8385c07a958fcc93acda3b4e",
    )
    assert execution_plan == expected
